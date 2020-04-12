const Pushover = require("pushover-notifications");

/** @typedef {import("../index").Store} Store */

class PushoverNotifier {
  constructor(config) {
    this.config = config;
  }

  /**
   * @param {Store} store
   * @param {string} type
   * @param {import("../index").SlotDate[]} slotDates
   * @return {Promise<void>}
   */
  async sendNotifications(store, type, slotDates) {
    const pushover = new Pushover({
      token: this.config.pushover_api_token,
    });

    for (const slotDate of slotDates) {
      const msg = {
        message: `${store.name} ${type} slots available between ${slotDate.date}`,
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
