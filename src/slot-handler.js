const config = require("./config");

/** @typedef {import("./index").Store} Store */
/** @typedef {import("./index").SlotDate} SlotDate */
/** @typedef {import("./index").Slot} Slot */

/**
 * @param {Slot} aSlot
 * @param {Slot} bSlot
 */
function compareSlots(aSlot, bSlot) {
  return Math.sign(aSlot.start.getTime() - bSlot.start.getTime());
}
/**
 * @param {Slot[]} currentSlots
 * @param {Slot[]} previousSlots
 */
function isNewSlots(currentSlots, previousSlots) {
  const newSlots = currentSlots.filter(
    (currentSlot) =>
      !previousSlots.some(
        (previousSlot) => compareSlots(previousSlot, currentSlot) == 0
      )
  );
  return newSlots.length > 0;
}

/**
 * @type {Map<string, Slot[]>}
 */
const previousSlotStore = new Map();

/**
 * @param {Store} store
 * @param {string} type
 * @param {SlotDate[]} slotDates
 */
async function sendNotifications(store, type, slotDates) {
  await Promise.all(
    config.notifiers.map((notifier) =>
      notifier.sendNotifications(store, type, slotDates)
    )
  );
}

/**
 * @param {Store} store
 * @param {string} type
 * @param {SlotDate[]} slotDates
 */
async function handleSlots(store, type, slotDates) {
  /** @type {Slot[]} */
  const allSlots = [];

  slotDates.forEach((slotdate) => {
    console.log(`${store.name} ${type} ${slotdate.date} slots:`);
    console.log(slotdate.slots);

    allSlots.push(...slotdate.slots);
  });

  const previousSlots = previousSlotStore.get(`${store.name}-${type}`) || [];
  previousSlotStore.set(`${store.name}-${type}`, allSlots);

  if (
    config.raw.alert_when_slots_gone &&
    previousSlots.length > 0 &&
    allSlots.length == 0
  ) {
    await sendNotifications(store, type, []);
  } else if (
    !("alert_when_slots_still_available" in config.raw) ||
    config.raw.alert_when_slots_still_available
  ) {
    if (slotDates.length > 0) {
      await sendNotifications(store, type, slotDates);
    }
  } else {
    // alert only when new slots appear
    const changedSlotDates = slotDates.filter((slotdate) =>
      isNewSlots(slotdate.slots, previousSlots)
    );

    if (changedSlotDates.length > 0) {
      await sendNotifications(store, type, changedSlotDates);
    }
  }
}

module.exports = { handleSlots };
