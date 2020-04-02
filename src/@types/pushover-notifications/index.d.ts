/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "pushover-notifications" {
  import { IncomingMessage } from "http";

  export type PushoverOptions = {
    token?: string;
    user?: string;
    httpOptions?: any;
    debug?: boolean;
    onerror?: (error: any, res: IncomingMessage) => void;
    updateSounds?: boolean;
  };

  export type PushoverSendOptions = {
    token?: string;
    user?: string;
    message: string;

    device?: string;
    title?: string;
    url?: string;
    url_title?: string;
    priority?: number;
    sound?: string;
    timestamp?: string;
    file?: string | { name: string; data: string };
  };

  export class Pushover {
    constructor(opts: PushoverOptions);
    send(
      opts: PushoverSendOptions,
      callback: (error: any, res: IncomingMessage) => void
    ): void;
  }

  export default Pushover;
}
