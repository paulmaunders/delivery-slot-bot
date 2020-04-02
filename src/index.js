// @ts-check
const fs = require("fs");
const ini = require("ini");
const schedule = require("node-schedule");
const puppeteer = require("puppeteer");
const Push = require("pushover-notifications");
const shell = require("shelljs");
const yargs = require("yargs");

// Read config
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));

function getBrowser() {
  if (process.env.PUPPETEER_BROWSER_WS_ENDPOINT) {
    return puppeteer.connect({
      browserWSEndpoint: process.env.PUPPETEER_BROWSER_WS_ENDPOINT,
    });
  }
  return puppeteer.launch();
}

async function assertResponseOk(response) {
  if (response.ok()) {
    return;
  }
  throw {
    message: `error: unexpected http response status ${response.status()} ${response.statusText()} with body:\n${await response.text()}\n`,
  };
}

async function goto(page, url) {
  await assertResponseOk(await page.goto(url));
}

async function clickAndWaitForNavigation(page, selector) {
  await assertResponseOk(
    (await Promise.all([page.waitForNavigation(), page.click(selector)]))[0]
  );
}

async function run() {
  const browser = await getBrowser();

  // Log time
  const executiontime = Date.now();
  const date = new Date(executiontime);
  console.log(executiontime + " " + date.toUTCString());

  try {
    // TESCO

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // Login
    await goto(page, "https://secure.tesco.com/account/en-GB/login?from=/");
    await page.type("#username", config.tesco_username);
    await page.type("#password", config.tesco_password);
    await clickAndWaitForNavigation(page, "#sign-in-form > button");
    await goto(page, "https://www.tesco.com/groceries/en-GB/slots/delivery");

    // Look for delivery pages
    const deliveryDates = await page.$$eval(
      ".slot-selector--week-tabheader-link",
      (elements) =>
        elements.map((item) => ({
          date: item.textContent,
          url: item["href"],
        }))
    );

    // console.log(deliveryDates);

    // Loop through delivery pages and check if slots are available
    for (const [deliveryIndex, item] of deliveryDates.entries()) {
      console.log("Opening " + item.url + " [" + item.date + "]");
      await goto(page, item.url);

      const html = await page.content();

      if (html.includes("No slots available! Try another day")) {
        console.log("No slots");
      } else {
        console.log("SLOTS AVAILABLE!!!");

        // Create screenshot folder if it doesn't exist
        const dir = config.output_dir + "/" + executiontime;

        if (!fs.existsSync(dir)) {
          shell.mkdir("-p", dir);
        }

        // Take a screenshot
        console.log("Taking screenshot");
        const screenshotPath = dir + "/tesco-delivery" + deliveryIndex + ".png";
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

        // Send push notification

        const p = new Push({
          token: config.pushover_api_token,
        });

        const msg = {
          message: "Delivery slots available between " + item.date,
          title: "Delivery Slot Bot",
          sound: "magic", // optional
          priority: 1, // optional,
          file: screenshotPath, // optional
          // see test/test_img.js for more examples of attaching images
        };

        for (const user of config.pushover_notification_users) {
          p.send({ ...msg, user }, function (err, result) {
            if (err) {
              throw err;
            }

            console.log(result);
          });
        }
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
