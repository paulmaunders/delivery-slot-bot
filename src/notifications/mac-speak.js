const { exec } = require("child_process");

/** @typedef {import("../index").Store} Store */

class MacSpeakNotifier {
  /**
   * @param {Store} store
   * @param {string} type
   * @param {import("../index").SlotDate[]} _slotDates
   * @return {Promise<void>}
   */
  async sendNotifications(store, type, _slotDates) {
    const myAlert = `Alert! Alert! Alert! We have ${store.name} ${type} slots!`;
    exec("say " + myAlert, function (error, stdout, stderr) {
      console.log("stdout: " + stdout);
      console.log("stderr: " + stderr);
      if (error !== null) {
        console.log("exec error: " + error);
      }
    });
  }
}

module.exports = { MacSpeakNotifier };
