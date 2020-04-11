const fs = require("fs");
const ini = require("ini");
const Push = require("pushover-notifications");

// Read config
const config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));

// Send push notification

const p = new Push({
  token: config.pushover_api_token,
});

const msg = {
  message: "Test push notification ",
  title: "Delivery Slot Bot",
  sound: "magic", // optional
  priority: 1,
};

for (const user of config.pushover_notification_users) {
  p.send({ ...msg, user }, function (err, result) {
    if (err) {
      throw err;
    }

    console.log(result);
  });
}
