import type { Page } from "puppeteer";

export declare type SlotDate = {
  date: string;
  screenshot: Buffer;
};

export declare interface Store {
  name: string;
  checkDeliveries(page: Page): Promise<SlotDate[]>;
  checkCollections(page: Page): Promise<SlotDate[]>;
}

export declare interface Notifier {
  sendNotifications(type: string, slotDates: SlotDate[]): Promise<void>;
}
