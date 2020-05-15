const config = require("./config");
const { PushoverNotifier } = require("./notifications/pushover");
const { TelegramNotifier } = require("./notifications/telegram");
const { MacSpeakNotifier } = require("./notifications/mac-speak");

/** @typedef {import("./index").Store} Store */
/** @typedef {import("./index").SlotDate} SlotDate */
/** @typedef {import("./index").Slot} Slot */

/**
 * @type {import("./index").Notifier[]}
 */
const notifiers = [];

if (config.pushover_api_token) {
  notifiers.push(
    new PushoverNotifier(
      config.pushover_api_token,
      config.pushover_notification_users
    )
  );
}

if (config.telegram_api_token) {
  notifiers.push(new TelegramNotifier(config));
}

if (config.mac_speak) {
  notifiers.push(new MacSpeakNotifier());
}

module.exports = notifiers;
