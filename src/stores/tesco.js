const { CookieStore } = require("../cookie-store");
const { goto, clickAndWaitForNavigation } = require("../puppeteer-utils");

const deliveryUrl = "https://www.tesco.com/groceries/en-GB/slots/delivery";
const collectionUrl = "https://www.tesco.com/groceries/en-GB/slots/collection";
const loginUrl = "https://secure.tesco.com/account/en-GB/login";

/** @typedef {import("puppeteer").Page} Page */
/** @typedef {import("../index").Slot} Slot */
/** @typedef {import("../index").SlotDate} SlotDate*/

/**
 * @param {Page} page
 */
async function assertLoginSuccess(page) {
  if (page.url().startsWith(loginUrl)) {
    const errorTextElement = await page.$("p.ui-component__notice__error-text");
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

class TescoStore {
  /**
   * @param {string} username
   * @param {string} password
   */
  constructor(username, password) {
    this.username = username;
    this.password = password;
    this.cookieStore = new CookieStore();
    this.name = "Tesco";
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
    await page.type("#username", this.username);
    await page.type("#password", this.password);
    await clickAndWaitForNavigation(page, "#sign-in-form > button");
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
    // Look for delivery pages
    const slotDates = await page.$$eval(
      ".slot-selector--week-tabheader-link",
      (elements) =>
        elements.map((item) => ({
          date: item.textContent,
          url: item["href"],
        }))
    );

    const foundSlotDates = [];

    for (const slotDate of slotDates) {
      if (!slotDate.date) {
        continue;
      }

      console.log("Opening " + slotDate.url + " [" + slotDate.date + "]");
      await goto(page, slotDate.url);

      const slotsRaw = await page.$$eval(
        ".slot-list--item.available",
        (elements) =>
          elements.map((element) => {
            const elementValue = /** @param {Element | null} element */ (
              element
            ) => element && element.getAttribute("value");
            const start = elementValue(
              element.querySelector('input[name="start"]')
            );
            const end = elementValue(
              element.querySelector('input[name="end"]')
            );
            return start && end ? { start, end } : undefined;
          })
      );
      const slots = slotsRaw
        .filter(
          /** @return {slot is {start: string, end: string}} */ (slot) => !!slot
        )
        .map(({ start, end }) => ({
          start: new Date(start),
          end: new Date(end),
        }));

      if (slots.length == 0) {
        console.log("No slots");
      } else {
        console.log("SLOTS AVAILABLE!!!");
        foundSlotDates.push({
          date: slotDate.date,
          slots,
          screenshot: await this.getScreenshot(page),
        });
      }
    }
    return foundSlotDates;
  }
}

module.exports = { TescoStore };
