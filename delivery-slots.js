const puppeteer = require("puppeteer");
const ini = require("ini");
var fs = require("fs");
var shell = require("shelljs");
var Push = require("pushover-notifications");

// Read config
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));

// Log time
var executiontime = Date.now();
var date = new Date(executiontime);
console.log(executiontime + ' ' + date.toUTCString());

// Check for delivery slot

async function run() {
  const browser = await puppeteer.launch();

  try {
    // TESCO

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // Login
    await page.goto("https://secure.tesco.com/account/en-GB/login?from=/");
    await page.type("#username", config.tesco_username);
    await page.type("#password", config.tesco_password);
    await page.click("#sign-in-form > button");
    await page.goto("https://www.tesco.com/groceries/en-GB/slots/delivery");

    var html = await page.content();

    // Look for delivery pages
    var deliveryDates = await page.$$eval(
      ".slot-selector--week-tabheader-link",
      elements =>
        elements.map(item => {
          return (itemarray = { date: item.textContent, url: item.href });
        })
    );

    // console.log(deliveryDates);

    // Loop through delivery pages and check if slots are available
    for (var i = 0, len = deliveryDates.length; i < len; i++) {
      item = deliveryDates[i];
      console.log("Opening " + item.url + " [" + item.date + "]");
      await page.goto(item.url);

      //if (i<2) {
      if (html.includes("No slots available! Try another day")) {
        console.log("No slots");
      } else {
        console.log("SLOTS AVAILABLE!!!");

        // Create screenshot folder if it doesn't exist
        var dir = config.output_dir + "/" + executiontime;

        if (!fs.existsSync(dir)) {
          shell.mkdir("-p", dir);
        }

        // Take a screenshot
        console.log("Taking screenshot");
        screenshotPath = dir + "/tesco-delivery" + i + ".png";
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });

        // Send push notification

        var p = new Push({
          token: config.pushover_api_token
        });

        var msg = {
          message: "Delivery slots available between " + item.date,
          title: "Delivery Slot Bot",
          sound: "magic", // optional
          priority: 1, // optional,
          file: screenshotPath // optional
          // see test/test_img.js for more examples of attaching images
        };

        for (
          var idx = 0, l = config.pushover_notification_users.length;
          idx < l;
          idx++
        ) {
          msg.user = config.pushover_notification_users[idx];
          // token can be overwritten as well.

          p.send(msg, function(err, result) {
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

run();
