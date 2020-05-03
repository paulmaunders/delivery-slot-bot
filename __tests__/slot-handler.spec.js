/* eslint-disable @typescript-eslint/camelcase */
const config = require("../src/config");
const { selectSlotDatesToSend } = require("../src/slot-handler");

jest.mock("../src/config");

const slots = [
  {
    start: new Date("2020-04-02T15:00:00+01:00"),
    end: new Date("2020-04-02T16:00:00+01:00"),
  },
  {
    start: new Date("2020-04-02T16:00:00+01:00"),
    end: new Date("2020-04-02T17:00:00+01:00"),
  },
];

describe("slot-handler", () => {
  it("selects changed slots", () => {
    config.alert_when_slots_still_available = false;

    const slotDates = [
      {
        date: "Apr 1 - 7",
        screenshot: new Buffer(""),
        slots: slots,
      },
    ];

    const previousSlots = [slots[0]];

    expect(selectSlotDatesToSend(slotDates, previousSlots)).toEqual(slotDates);
  });

  it("selects no unchanged slots", () => {
    config.alert_when_slots_still_available = false;

    const slotDates = [
      {
        date: "Apr 1 - 7",
        screenshot: new Buffer(""),
        slots: slots,
      },
    ];

    const previousSlots = slots;

    expect(selectSlotDatesToSend(slotDates, previousSlots)).toEqual(undefined);
  });

  it("selects all slots", () => {
    config.alert_when_slots_still_available = true;

    const slotDates = [
      {
        date: "Apr 1 - 7",
        screenshot: new Buffer(""),
        slots: slots,
      },
    ];

    const previousSlots = slots;

    expect(selectSlotDatesToSend(slotDates, previousSlots)).toEqual(slotDates);
  });

  it("selects no slots", () => {
    config.alert_when_slots_still_available = true;
    config.alert_when_slots_gone = undefined;

    const slotDates = [];

    const previousSlots = slots;

    expect(selectSlotDatesToSend(slotDates, previousSlots)).toEqual(undefined);
  });

  it("selects gone slots", () => {
    config.alert_when_slots_gone = true;

    const slotDates = [];

    const previousSlots = slots;

    expect(selectSlotDatesToSend(slotDates, previousSlots)).toEqual([]);
  });
});
