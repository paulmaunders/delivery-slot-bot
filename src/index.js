const fs = require("fs");
const ini = require("ini");
const schedule = require("node-schedule");
const yargs = require("yargs");

const { getBrowser } = require("./puppeteer-utils");
const { PushoverNotifier } = require("./notifications/pushover");
const { MacSpeakNotifier } = require("./notifications/mac-speak");
const { TescoStore } = require("./stores/tesco");

/** @typedef {import("./index").Store} Store */
/** @typedef {import("./index").SlotDate} SlotDate */

// Read config
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));
/**
 * @type {Store[]}
 */
const stores = [];
/**
 * @type {import("./index").Notifier[]}
 */
const notifiers = [];

if (config.tesco_username) {
  stores.push(new TescoStore(config.tesco_username, config.tesco_password));
}

if (config.pushover_api_token) {
  notifiers.push(new PushoverNotifier(config));
}

if (config.mac_speak) {
  notifiers.push(new MacSpeakNotifier());
}

/**
 * @param {Store} store
 * @param {string} type
 * @param {SlotDate[]} slotDates
 */
async function sendNotifications(store, type, slotDates) {
  if (slotDates.length == 0) {
    return;
  }

  slotDates.forEach((slotdate) => {
    console.log(`${store.name} ${type} ${slotdate.date} slots:`);
    console.log(slotdate.slots);
  });

  await Promise.all(
    notifiers.map((notifier) =>
      notifier.sendNotifications(store, type, slotDates)
    )
  );
}

async function run() {
  const browser = await getBrowser();
  const userAgent =
    config.useragent || (await browser.userAgent()).replace(/headless/i, "");

  // Log time
  const executiontime = Date.now();
  const date = new Date(executiontime);
  console.log(executiontime + " " + date.toUTCString());

  try {
    for (const store of stores) {
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 1366, height: 768 });

      // check delivery if either not configured or set to true
      if (!("delivery" in config) || config.delivery) {
        await sendNotifications(
          store,
          "delivery",
          await store.checkDeliveries(page)
        );
      }

      if (config.click_and_collect) {
        await sendNotifications(
          store,
          "collection",
          await store.checkCollections(page)
        );
      }
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    await browser.close();
  }
}

yargs
  .command("cron", "Runs with the internal cron scheduler", {}, () =>
    schedule.scheduleJob(config.cron, () => run())
  )
  .command("*", "Runs one-off", {}, () => run())
  .help().argv;
