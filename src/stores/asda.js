const moment = require("moment-timezone");
const { CookieStore } = require("../cookie-store");
const { StoreError } = require("../errors");
const { goto } = require("../puppeteer-utils");

const deliveryUrl = "https://groceries.asda.com/checkout/book-slot?tab=deliver";
const collectionUrl =
  "https://groceries.asda.com/checkout/book-slot?tab=collect";
const loginUrl = "https://www.asda.com/login";
const slotUrl = "https://groceries.asda.com/api/v3/slot/view";

/** @typedef {import("puppeteer").Page} Page */
/** @typedef {import("puppeteer").Response} Response */
/** @typedef {import("../index").Slot} Slot */
/** @typedef {import("../index").SlotDate} SlotDate*/

/**
 * @param {Page} page
 */
async function assertLoginSuccess(page) {
  if (page.url().startsWith(loginUrl)) {
    const errorTextElement = await page.$(".login-container .form-error");
    if (errorTextElement) {
      const errorText = await page.evaluate(
        (element) => element.innerText,
        errorTextElement
      );
      throw new StoreError(
        `Auth failed. Please check details are correct in config.ini, with reason: ${errorText}`
      );
    }
    const recaptchaElement = await page.$("#recaptcha-container");
    if (recaptchaElement) {
      throw new StoreError(
        "Auth failed. The website is thinks this could be a bot, and is showing a Recaptch check. Try logging in yourself, and this might go away"
      );
    }
    throw new StoreError(
      "Auth failed. Please check details are correct in config.ini"
    );
  }
}

class AsdaStore {
  /**
   * @param {string} username
   * @param {string} password
   */
  constructor(username, password) {
    this.username = username;
    this.password = password;
    this.cookieStore = new CookieStore();
    this.name = "ASDA";
  }

  /**
   * @param {Page} page
   * @param {string} url
   */
  async login(page, url) {
    console.log("Logging in with new user session");

    // go directly to login, suggesting delivery page after login
    const loginParams = new URLSearchParams({
      // eslint-disable-next-line @typescript-eslint/camelcase
      redirect_uri: url,
    });
    await goto(page, `${loginUrl}?${loginParams.toString()}`);
    await page.type(".username-box input", this.username);
    await page.type("#password", this.password);
    await page.click(".login-container form button.primary");
    await Promise.race([
      page.waitForNavigation(),
      page.waitForSelector(
        ".login-container .form-error, #recaptcha-container"
      ),
    ]);
    await assertLoginSuccess(page);

    // keep cookies for next run
    this.cookieStore.set(await page.cookies());
  }

  /**
   * @param {Page} page
   */
  async isLoginRequired(page) {
    return (
      page.url().startsWith(loginUrl) ||
      (await page.$$eval(
        ".asda-dialog",
        (elements) =>
          elements.filter(
            (element) => element.getAttribute("data-auto-id") == "signInModal"
          ).length > 0
      ))
    );
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

      await Promise.race([
        page.waitForSelector(".asda-dialog, .co-slots__prices-by-time"),
        page.waitForNavigation(),
      ]);

      // if login was required, reset cookies
      if (await this.isLoginRequired(page)) {
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
  }

  /**
   * @param {Page} page
   * @returns {Promise<SlotDate[]>}
   */
  async checkDeliveries(page) {
    await this.start(page, deliveryUrl);
    return await this.getSlots(deliveryUrl, page);
  }

  /**
   * @param {Page} page
   * @returns {Promise<SlotDate[]>}
   */
  async checkCollections(page) {
    await this.start(page, collectionUrl);
    return await this.getSlots(collectionUrl, page);
  }

  /**
   * @param {Page} page
   * @returns {Promise<Buffer>}
   */
  async getScreenshot(page) {
    // Take a screenshot
    console.log("Taking screenshot");

    const element = await page.$(".co-book-slot__content");

    if (element) {
      return await element.screenshot({});
    }

    return await page.screenshot({
      fullPage: true,
    });
  }

  /**
   * @param {string} url
   * @param {Page} page
   * @returns {Promise<SlotDate[]>}
   */
  async getSlots(url, page) {
    /** @type {any | undefined} */
    let feed;

    // find the slots json response
    const listener = /** @param {Response} response **/ async (response) => {
      if (response.url() == slotUrl) {
        feed = await response.json();
      }
    };

    page.on("response", listener);
    console.log("Opening " + url);
    await goto(page, url);
    await page.waitForSelector(".co-slots__prices-by-time");
    page.off("response", listener);

    const foundSlotDates = [];

    if (feed && "data" in feed) {
      // the day of the month is at 12am in the region's timezone, but
      // represented in UTC, so needs to be aware of the timezone.
      // Otherwise, like UK BST would be off by one day 11pm the previous day
      const tz = feed.data.nearest_collection_point
        ? feed.data.nearest_collection_point.supported_timezone
        : feed.data.slot_days[0].supported_timezone;
      const startDay = moment(feed.data.start_date).tz(tz).format("MMM D");
      const endDay = moment(feed.data.end_date).tz(tz).format("MMM D");

      const slots = [];

      for (const slotDay of feed.data.slot_days) {
        for (const slot of slotDay.slots) {
          if (slot.slot_info.status == "AVAILABLE") {
            slots.push({
              start: new Date(slot.slot_info.start_time),
              end: new Date(slot.slot_info.end_time),
            });
          }
        }
      }

      if (slots.length == 0) {
        console.log("No slots");
      } else {
        console.log("SLOTS AVAILABLE!!!");

        foundSlotDates.push({
          date: `${startDay} - ${endDay}`,
          slots,
          screenshot: await this.getScreenshot(page),
        });
      }
    }

    return foundSlotDates;
  }
}

module.exports = { AsdaStore };
