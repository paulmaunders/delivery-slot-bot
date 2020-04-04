// @ts-check
const fs = require("fs");
const ini = require("ini");
const schedule = require("node-schedule");
const yargs = require("yargs");

const { getBrowser } = require("./puppeteer-utils");
const { sendNotifications } = require("./notifications/pushover");
const { TescoStore } = require("./stores/tesco");

// Read config
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));
const store = new TescoStore(config.tesco_username, config.tesco_password);

async function run() {
  const browser = await getBrowser();

  // Log time
  const executiontime = Date.now();
  const date = new Date(executiontime);
  console.log(executiontime + " " + date.toUTCString());

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // check delivery if either not configured or set to true
    if (!("delivery" in config) || config.delivery) {
      const deliverySlots = await store.checkDeliveries(page);
      if (deliverySlots) {
        sendNotifications(config, "Delivery slots", deliverySlots);
      }
    }

    if (config.click_and_collect) {
      const collectionSlots = await store.checkCollections(page);
      if (collectionSlots) {
        sendNotifications(config, "Collection slots", collectionSlots);
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
