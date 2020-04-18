const { exec } = require("child_process");

/** @typedef {import("../index").Store} Store */

class MacSpeakNotifier {
  /**
   * @param {Store} store
   * @param {string} type
   * @param {import("../index").SlotDate[]} slotDates
   * @return {string}
   */
  getAlertMessage(store, type, slotDates) {
    if (slotDates.length > 0) {
      return `Alert! Alert! We have ${store.name} ${type} slots!`;
    } else {
      return `Alert! The ${store.name} ${type} slots have gone!`;
    }
  }

  /**
   * @param {Store} store
   * @param {string} type
   * @param {import("../index").SlotDate[]} slotDates
   * @return {Promise<void>}
   */
  async sendNotifications(store, type, slotDates) {
    await this.sendMessage(this.getAlertMessage(store, type, slotDates));
  }

  /**
   * @param {string} message
   */
  async sendMessage(message) {
    exec("say " + message, function (error, stdout, stderr) {
      console.log("stdout: " + stdout);
      console.log("stderr: " + stderr);
      if (error !== null) {
        console.log("exec error: " + error);
      }
    });
  }
}

module.exports = { MacSpeakNotifier };
