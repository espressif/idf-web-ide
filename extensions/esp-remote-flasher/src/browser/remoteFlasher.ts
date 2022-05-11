import { Emitter } from "@theia/core";
import { injectable } from "inversify";
import { FlasherClient, FlashEvents } from "../common/protocol";
import { deserialize } from "bson";

@injectable()
export class FlasherClientImpl implements FlasherClient {
  constructor() {
    this.address = "ws://localhost:3362/flash";
    FlasherClientImpl.instance = this;
  }
  private static instance: FlasherClientImpl;
  private clientHandler: WebSocket;
  private readonly address: string;

  private readonly onDidCloseConnectionEmitter: Emitter<
    FlashEvents.ConnectionClosed
  > = new Emitter<FlashEvents.ConnectionClosed>();
  readonly onDidCloseConnection = this.onDidCloseConnectionEmitter.event;

  private readonly onFlashErrorEmitter: Emitter<
    FlashEvents.FlashError
  > = new Emitter<FlashEvents.FlashError>();
  readonly onFlassError = this.onFlashErrorEmitter.event;

  private readonly onFlashDoneEmitter: Emitter<
    FlashEvents.FlashDone
  > = new Emitter<FlashEvents.FlashDone>();
  readonly onFlashDone = this.onFlashDoneEmitter.event;

  private isRunning: boolean;

  public static init() {
    if (FlasherClientImpl.instance) {
      return FlasherClientImpl.instance;
    }
  }

  flash(data: Buffer) {
    if (this.clientHandler.readyState === this.clientHandler.OPEN) {
      this.clientHandler.send(data);
    }
  }

  isFlashing() {
    return this.isRunning;
  }
  setIsFlashing(v: boolean) {
    this.isRunning = v;
  }

  connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (
        this.clientHandler &&
        this.clientHandler.readyState == this.clientHandler.OPEN
      ) {
        return resolve("Using existing remote flasher");
      }
      this.clientHandler = new WebSocket(this.address);

      this.clientHandler.onopen = () => {
        resolve("Remote flasher Connected");
      };

      this.clientHandler.onerror = (err) => {
        this.isRunning = false;
        this.onFlashErrorEmitter.fire(FlashEvents.FlashError);
        reject(err);
      };

      this.clientHandler.onclose = () => {
        this.isRunning = false;
        this.onDidCloseConnectionEmitter.fire(FlashEvents.ConnectionClosed);
      };
      this.clientHandler.onmessage = (event) => {
        this.messageHandler(event);
      };
    });
  }

  async messageHandler(event: MessageEvent) {
    try {
      console.log(event.data);
      let data: any = event.data;
      if (data && data.arrayBuffer) {
        data = await data.arrayBuffer();
        data = Buffer.from(data);
      }
      const message = deserialize(data);
      if (message && message["messageType"]) {
        switch (message["messageType"]) {
          case "flash_done":
            return this.onFlashDoneEmitter.fire(FlashEvents.FlashDone);
          case "flash_error":
            console.error(message);
            return this.onFlashErrorEmitter.fire(FlashEvents.FlashError);
          default:
            return console.warn(
              "[Flash ⚡️]: Unrecognized message received from the chip",
              message
            );
        }
      } else {
        return console.warn(
          "[Flash ⚡️]: Unsupported message received from the chip",
          message
        );
      }
    } catch (error) {
      console.error(error);
    }
  }
}
