const config = require("./config");
const { TescoStore } = require("./stores/tesco");
const { AsdaStore } = require("./stores/asda");
const { MorrisonsStore } = require("./stores/morrisons");

/** @typedef {import("./index").Store} Store */
/** @typedef {import("./index").SlotDate} SlotDate */
/** @typedef {import("./index").Slot} Slot */

/**
 * @type {Store[]}
 */
const stores = [];
/**
 * @type {import("./index").Notifier[]}
 */

if (config.tesco_username) {
  stores.push(new TescoStore(config.tesco_username, config.tesco_password));
}

if (config.asda_username) {
  stores.push(new AsdaStore(config.asda_username, config.asda_password));
}

if (config.morrisons_username) {
  stores.push(
    new MorrisonsStore(config.morrisons_username, config.morrisons_password)
  );
}

module.exports = stores;
