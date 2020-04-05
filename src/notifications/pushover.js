// @ts-check
const Push = require("pushover-notifications");

class PushoverNotifier {
  constructor(config) {
    this.config = config;
  }
  async sendNotifications(type, slotDates) {
    const pushover = new Push({
      token: this.config.pushover_api_token,
    });

    for (const slotDate of slotDates) {
      const msg = {
        message: `${type} available between ${slotDate.date}`,
        title: "Delivery Slot Bot",
        sound: "magic",
        priority: 1,
        file: {
          name: `${slotDate.date}.png`,
          data: slotDate.screenshot,
        },
      };

      for (const user of this.config.pushover_notification_users) {
        pushover.send({ ...msg, user }, function (err, result) {
          if (err) {
            throw err;
          }

          console.log(result);
        });
      }
    }
  }
}

module.exports = { PushoverNotifier };
