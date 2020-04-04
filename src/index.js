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

const deliveryUrl = "https://www.tesco.com/groceries/en-GB/slots/delivery";
const loginUrl = "https://secure.tesco.com/account/en-GB/login";

function getBrowser() {
  if (process.env.PUPPETEER_BROWSER_WS_ENDPOINT) {
    return puppeteer.connect({
      browserWSEndpoint: process.env.PUPPETEER_BROWSER_WS_ENDPOINT,
    });
  }
  return puppeteer.launch();
}

/**
 * @param {puppeteer.Response} response
 */
async function assertResponseOk(response) {
  if (response.ok()) {
    return;
  }
  throw {
    message: `error: unexpected http response status ${response.status()} ${response.statusText()} with body:\n${await response.text()}\n`,
  };
}

/**
 * @param {puppeteer.Page} page
 * @param {string} url
 */
async function goto(page, url) {
  await assertResponseOk(await page.goto(url));
}

/**
 * @param {puppeteer.Page} page
 * @param {string} selector
 */
async function clickAndWaitForNavigation(page, selector) {
  await assertResponseOk(
    (await Promise.all([page.waitForNavigation(), page.click(selector)]))[0]
  );
}

/**
 * @param {puppeteer.Page} page
 */
async function assertLoginSuccess(page) {
  if (page.url().startsWith(loginUrl)) {
    throw {
      message: `error: Auth failed. Please check details are correct in config.ini, ${
        page.url
      } ${await page.content()}`,
    };
  }
}

let cookieStore = null;

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

    if (cookieStore) {
      await page.setCookie(...cookieStore);
      // optimistically go to delivery page in case of existing user session
      await goto(page, deliveryUrl);

      // if login was required, reset cookies
      if (page.url().startsWith(loginUrl)) {
        const client = await page.target().createCDPSession();
        await client.send("Network.clearBrowserCookies");
        cookieStore = null;
      }
    }

    if (!cookieStore) {
      console.log("Logging in with new user session");

      // go directly to login, suggesting delivery page after login
      const loginParams = new URLSearchParams({
        from: deliveryUrl,
      });
      await goto(page, `${loginUrl}?${loginParams.toString()}`);
      await page.type("#username", config.tesco_username);
      await page.type("#password", config.tesco_password);
      await clickAndWaitForNavigation(page, "#sign-in-form > button");
      await assertLoginSuccess(page);

      // keep cookies for next run
      cookieStore = await page.cookies();
    } else {
      console.log("Already logged in");
    }

    // login should redirect to delivery, but check just in case it hasn't
    if (!page.url().startsWith(deliveryUrl)) {
      console.log("Revisiting delivery page");
      await goto(page, deliveryUrl);
    }

    // Look for delivery pages
    const deliveryDates = await page.$$eval(
      ".slot-selector--week-tabheader-link",
      (elements) =>
        elements.map((item) => ({
          date: item.textContent,
          url: item["href"],
        }))
    );

    // Loop through delivery pages and check if slots are available
    for (const [deliveryIndex, item] of deliveryDates.entries()) {
      console.log("Opening " + item.url + " [" + item.date + "]");
      await goto(page, item.url);

      const deliverySlots = await page.$$(".slot-list--item .available");

      if (deliverySlots.length == 0) {
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
