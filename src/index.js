const schedule = require("node-schedule");
const yargs = require("yargs");

const config = require("./config");
const { getBrowser } = require("./puppeteer-utils");
const { handleSlots } = require("./slot-handler");

async function run() {
  const browser = await getBrowser();
  const userAgent =
    config.raw.useragent ||
    (await browser.userAgent()).replace(/headless/i, "");

  // Log time
  const executiontime = Date.now();
  const date = new Date(executiontime);
  console.log(executiontime + " " + date.toUTCString());

  try {
    for (const store of config.stores) {
      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 1366, height: 768 });

      // check delivery if either not configured or set to true
      if (!("delivery" in config.raw) || config.raw.delivery) {
        await handleSlots(store, "delivery", await store.checkDeliveries(page));
      }

      if (config.raw.click_and_collect) {
        await handleSlots(
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
    schedule.scheduleJob(config.raw.cron, () => run())
  )
  .command("*", "Runs one-off", {}, () => run())
  .help().argv;
