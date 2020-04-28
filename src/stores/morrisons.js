const { CookieStore } = require("../cookie-store");
const { goto, clickAndWaitForNavigation } = require("../puppeteer-utils");

const deliveryUrl = "https://groceries.store.morrisons.com/delivery/home/slots";
const collectionUrl = "https://groceries.store.morrisons.com/delivery/collection";
const loginUrl = "https://accounts.groceries.morrisons.com/auth-service/sso/login"

/** @typedef {import("puppeteer").Page} Page */
/** @typedef {import("../index").Slot} Slot */
/** @typedef {import("../index").SlotDate} SlotDate*/

/**
 * @param {Page} page
 */
async function assertLoginSuccess(page) {
  if (page.url().startsWith(loginUrl)) {
    const errorTextElement = await page.$("div.info.info--error");
    if (errorTextElement) {
      const errorText = await page.evaluate(
        (element) => element.innerText,
        errorTextElement
      );
      throw {
        message: `error: Auth failed. Please check details are correct in config.ini, with reason: ${errorText}`,
      };
    } else {
      throw {
        message: `error: Auth failed. Please check details are correct in config.ini`,
      };
    }
  }
}

class MorrisonsStore {
  /**
   * @param {string} username
   * @param {string} password
   */
  constructor(username, password) {
    this.username = username;
    this.password = password;
    this.cookieStore = new CookieStore();
    this.name = "Morrisons";
  }

  /**
   * @param {Page} page
   * @param {string} url
   */
  async login(page, url) {
    console.log("Logging in with new user session");

    // go directly to login, suggesting delivery page after login
    const loginParams = new URLSearchParams({
      from: url,
    });
    await goto(page, `${loginUrl}?${loginParams.toString()}`);
    await page.type("#login-input", this.username);
    await page.type("body > div.containerWrapper > div > div.content > div > div > div > div.login__regular > div > form > div:nth-child(2) > input[type=password]", this.password);
    await clickAndWaitForNavigation(page, "#login-submit-button");
    await assertLoginSuccess(page);

    // keep cookies for next run
    this.cookieStore.set(await page.cookies());
  }

  /**
   * @param {Page} page
   * @param {string} url
   */
  async start(page, url) {
    const cookies = this.cookieStore.get();
    if (cookies) {
      await page.setCookie(...cookies);
      // optimistically go to delivery page in case of existing user session
      await goto(page, url);

      // if login was required, reset cookies
      if (page.url().startsWith(loginUrl)) {
        const client = await page.target().createCDPSession();
        await client.send("Network.clearBrowserCookies");
        this.cookieStore.set(null);
      } else {
        console.log("Already logged in");
      }
    }
    if (!this.cookieStore.get()) {
      await this.login(page, url);
    }

    // login should redirect to the url, but check just in case it hasn't
    if (!page.url().startsWith(url)) {
      console.log("Revisiting intended page");
      await goto(page, url);
    }
  }

  /**
   * @param {Page} page
   * @returns {Promise<SlotDate[]>}
   */
  async checkDeliveries(page) {
    await this.start(page, deliveryUrl);
    return await this.getSlots(page);
  }

  /**
   * @param {Page} page
   * @returns {Promise<SlotDate[]>}
   */
  async checkCollections(page) {
    await this.start(page, collectionUrl);
    return await this.getSlots(page);
  }

  /**
   * @param {Page} page
   * @returns {Promise<Buffer>}
   */
  async getScreenshot(page) {
    // Take a screenshot
    console.log("Taking screenshot");

    return await page.screenshot({
      fullPage: true,
    });
  }

  /**
   * @param {Page} page
   * @returns {Promise<SlotDate[]>}
   */
  async getSlots(page) {

    const foundSlotDates = [];
    const $html = await page.content();

    // <span>First available slot</span><span>Sun 03 May 16:00 - 17:00</span>
    /*
    <div type="success" class="alert__Wrapper-sc-103uc8r-0 jbXexM"><span><span class="heading__Base-sc-1b71ri0-0 alert__Title-sc-103uc8r-1 gFQtSe">First available slot</span><span>Sun 03 May 16:00 - 17:00 <a class="anchor__Anchor-sc-8ir86-0 kpZTjn">View slot</a></span></span></div>
    */

    const slots = [];

    slots.push({
      start: new Date("Sun 03 May"),
      end: new Date("Sun 03 May"),
    });

    if (slots.length == 0) {
      console.log("No slots");
    } else {
      console.log("SLOTS AVAILABLE!!!");
      foundSlotDates.push({
        date: "Sun 03 May",
        slots,
        screenshot: await this.getScreenshot(page),
      });
    }

    return foundSlotDates;
  }
}

module.exports = { MorrisonsStore };
