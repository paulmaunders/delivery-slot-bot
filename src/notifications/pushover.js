const Pushover = require("pushover-notifications");

/** @typedef {import("../index").Store} Store */

class PushoverNotifier {
  /**
   * @param {string} apiToken
   * @param {string[]} users
   */
  constructor(apiToken, users) {
    this.apiToken = apiToken;
    this.users = users;
  }

  /**
   * @param {Pushover.PushoverSendOptions} msg
   */
  _sendMessage(msg) {
    return Promise.all(
      this.users.map((user) => this._sendPushoverMessage({ ...msg, user }))
    );
  }

  /**
   * @param {Pushover.PushoverSendOptions} msg
   */
  _sendPushoverMessage(msg) {
    return new Promise((resolve, reject) => {
      const pushover = new Pushover({
        token: this.apiToken,
      });
      pushover.onerror = (err) => reject(err);
      pushover.send(msg, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * @param {Store} store
   * @param {string} type
   * @param {import("../index").SlotDate[]} slotDates
   * @return {Promise<void>}
   */
  async sendNotifications(store, type, slotDates) {
    if (slotDates.length == 0) {
      this._sendMessage({
        message: `${store.name} ${type} slots no longer available`,
        title: "Delivery Slot Bot",
        sound: "falling",
        priority: 1,
      });
    } else {
      for (const slotDate of slotDates) {
        this._sendMessage({
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
    this._sendMessage({
      message,
      title: "Delivery Slot Bot",
      sound: "magic", // optional
      priority: 1,
    });
  }
}

module.exports = { PushoverNotifier };
