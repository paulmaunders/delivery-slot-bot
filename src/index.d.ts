import type { Page } from "puppeteer";

export declare type SlotDate = {
  date: string;
  slots: Slot[];
  screenshot: Buffer;
};

export declare type Slot = {
  start: Date;
  end: Date;
};

export declare interface Store {
  name: string;
  checkDeliveries(page: Page): Promise<SlotDate[]>;
  checkCollections(page: Page): Promise<SlotDate[]>;
}

export declare interface Notifier {
  sendNotifications(type: string, slotDates: SlotDate[]): Promise<void>;
}
