/*eslint @typescript-eslint/camelcase: ["error", {properties: "never"}]*/
const telegram = require("telegram-bot-api");
const util = require("util");

/** @typedef {import("../index").Store} Store */

class TelegramNotifier {
  constructor(config) {
    this.config = config;
  }

  async sendMessage(msg) {
    const api = new telegram({ token: this.config.telegram_api_token });

    api.getUpdates({}).then(function (data) {
      api
        .sendMessage({
          chat_id: data[0].channel_post.chat.id,
          text: msg,
          parse_mode: "HTML",
        })
        .then(function (data) {
          console.log(util.inspect(data, false, null));
        });
    });
  }

  /**
   * @param {Store} store
   * @param {string} type
   * @param {import("../index").SlotDate} slotDate
   * @return {string}
   */
  generateMessage(store, type, slotDate) {
    return `<b>Delivery slot found!</b>\n${store.name} ${type} slots available between ${slotDate.date}. Check <a href="https://www.tesco.com/groceries/en-GB/slots/delivery">here.</a>`;
  }

  /**
   * @param {Store} store
   * @param {string} type
   * @param {import("../index").SlotDate[]} slotDates
   * @return {Promise<void>}
   */
  async sendNotifications(store, type, slotDates) {
    if (slotDates && slotDates.length != 0) {
      for (const slotDate of slotDates) {
        const msg = this.generateMessage(store, type, slotDate);
        this.sendMessage(msg);
      }
    } else {
      this.sendMessage(`no slots`);
    }
  }
}

module.exports = { TelegramNotifier };
