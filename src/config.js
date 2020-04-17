const fs = require("fs");
const ini = require("ini");

const { PushoverNotifier } = require("./notifications/pushover");
const { MacSpeakNotifier } = require("./notifications/mac-speak");
const { TescoStore } = require("./stores/tesco");
const { AsdaStore } = require("./stores/asda");

/** @typedef {import("./index").Store} Store */
/** @typedef {import("./index").SlotDate} SlotDate */
/** @typedef {import("./index").Slot} Slot */

const rawConfig = ini.parse(fs.readFileSync("./config.ini", "utf-8"));

/**
 * @type {Store[]}
 */
const stores = [];
/**
 * @type {import("./index").Notifier[]}
 */
const notifiers = [];
/**
 * @type {Map<string, Slot[]>}
 */

if (rawConfig.tesco_username) {
  stores.push(
    new TescoStore(rawConfig.tesco_username, rawConfig.tesco_password)
  );
}

if (rawConfig.asda_username) {
  stores.push(new AsdaStore(rawConfig.asda_username, rawConfig.asda_password));
}

if (rawConfig.pushover_api_token) {
  notifiers.push(new PushoverNotifier(rawConfig));
}

if (rawConfig.mac_speak) {
  notifiers.push(new MacSpeakNotifier());
}

module.exports = { raw: rawConfig, notifiers, stores };
