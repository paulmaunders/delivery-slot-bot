const fs = require("fs");

/** @typedef {import("../index").Store} Store */
/** @typedef {import("../index").SlotDate} SlotDate */

class FileNotifier {
  _saveFile(outputFile, data, options = "") {
    fs.writeFile(outputFile, data, options, function (err) {
      if (err) {
        return console.log(`Failed to save file ${outputFile}; err = ${err}`);
      }

      console.log(`Output ${outputFile} saved successfully`);
    });
  }

  /**
   * @param {Store} store
   * @param {string} type
   * @param {SlotDate[]} slotDates
   * @return {Promise<void>}
   */
  async sendNotifications(store, type, slotDates) {
    const data = JSON.stringify(
      {
        slotsAvailable: slotDates.length > 0,
        store: store.name,
        type: type,
        slotDates: slotDates.map((slotDate) => {
          const filename = `output/${store.name}-${slotDate.date}.png`;
          this._saveFile(filename, slotDate.screenshot, "binary");
          slotDate.screenshot = new Buffer(filename);
          return slotDate;
        }),
      },
      null,
      2
    );

    this._saveFile(`output/${store.name}-${type}.json`, data);
  }

  async sendMessage(_) {
    console.error(
      "Called FileNotifier.sendMessage(), but there is nothing to do"
    );
  }
}

module.exports = { FileNotifier };
