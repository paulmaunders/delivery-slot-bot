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

module.exports = { isNewSlots };
