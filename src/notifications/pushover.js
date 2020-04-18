const Pushover = require("pushover-notifications");

/** @typedef {import("../index").Store} Store */

class PushoverNotifier {
  constructor(config) {
    this.config = config;
  }

  /**
   * @param {Pushover} pushover
   * @param {Pushover.PushoverSendOptions} msg
   */
  _sendMessage(pushover, msg) {
    for (const user of this.config.pushover_notification_users) {
      pushover.send({ ...msg, user }, function (err, result) {
        if (err) {
          throw err;
        }

        console.log(result);
      });
    }
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

    if (slotDates.length == 0) {
      this._sendMessage(pushover, {
        message: `${store.name} ${type} slots no longer available`,
        title: "Delivery Slot Bot",
        sound: "falling",
        priority: 1,
      });
    } else {
      for (const slotDate of slotDates) {
        this._sendMessage(pushover, {
          message: `${store.name} ${type} slots available between ${slotDate.date}`,
          title: "Delivery Slot Bot",
          sound: "magic",
          priority: 1,
          file: {
            name: `${slotDate.date}.png`,
            data: slotDate.screenshot,
          },
        });
      }
    }
  }

  /**
   * @param {string} message
   */
  async sendMessage(message) {
    const pushover = new Pushover({
      token: this.config.pushover_api_token,
    });

    this._sendMessage(pushover, {
      message,
      title: "Delivery Slot Bot",
      sound: "magic", // optional
      priority: 1,
    });
  }
}

module.exports = { PushoverNotifier };
