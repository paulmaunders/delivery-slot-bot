const schedule = require("node-schedule");
const yargs = require("yargs");

const config = require("./config");
const { StoreError } = require("./errors");
const notifiers = require("./notifiers");
const { getBrowser } = require("./puppeteer-utils");
const { handleSlots } = require("./slot-handler");
const stores = require("./stores");

/** @typedef {import("./index").Store} Store */

/**
 * @param {Store} store
 */
async function runStore(store) {
  const browser = await getBrowser();
  const userAgent =
    config.useragent || (await browser.userAgent()).replace(/headless/i, "");

  // Log time
  const executiontime = Date.now();
  const date = new Date(executiontime);
  console.log(executiontime + " - " + store.name + " - " + date.toUTCString());

  try {
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 1366, height: 768 });

    // check delivery if either not configured or set to true
    if (!("delivery" in config) || config.delivery) {
      await handleSlots(store, "delivery", await store.checkDeliveries(page));
    }

    if (config.click_and_collect) {
      await handleSlots(
        store,
        "collection",
        await store.checkCollections(page)
      );
    }
  } catch (err) {
    if (err instanceof StoreError) {
      console.error(`error: ${err.message}`);
    } else {
      console.error("unexpected error:");
      console.error(err);
    }
  } finally {
    await browser.close();
  }
}

async function run() {
  for (const store of stores) {
    await runStore(store);
  }
}

yargs
  .command("cron", "Runs with the internal cron scheduler", {}, () =>
    schedule.scheduleJob(config.cron, () => run())
  )
  .command("send-test", "Sends test notifications", {}, () => {
    notifiers.forEach((notifier) => notifier.sendMessage("Test message"));
  })
  // .command(
  //   "store-test [store]",
  //   "",
  //   (yargs) => yargs.positional("store", { type: "string" }),
  //   (argv) => {
  //     stores
  //       .find((store) => store.name == argv.store)
  //       ?.checkDeliveries();
  //   }
  // )
  .command("*", "Runs one-off", {}, () => run())
  .help().argv;
