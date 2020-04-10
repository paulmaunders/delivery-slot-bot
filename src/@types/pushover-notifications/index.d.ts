/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from "http";

declare namespace Pushover {
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
    file?: string | { name: string; data: string | Buffer };
  };
}

declare class Pushover {
  constructor(opts: Pushover.PushoverOptions);
  send(
    opts: Pushover.PushoverSendOptions,
    callback: (error: any, res: IncomingMessage) => void
  ): void;
}

export = Pushover;
