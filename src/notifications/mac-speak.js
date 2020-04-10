const { exec } = require("child_process");

class MacSpeakNotifier {
  /**
   * @param {string} type
   * @param {import("../index").SlotDate[]} _slotDates
   * @return {Promise<void>}
   */
  async sendNotifications(type, _slotDates) {
    const myAlert = `Alert! Alert! Alert! We have ${type}!`;
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
