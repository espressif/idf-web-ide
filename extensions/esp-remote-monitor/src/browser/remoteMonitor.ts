import { Emitter } from "@theia/core";
import { serialize, deserialize } from "bson";
import { MessageProtocol } from "../common/message";
import {
  MonitorErrors,
  MonitorEvents,
  MonitorEventWithData,
  MonitorType,
  RemoteMonitorManager,
} from "../common/monitor";

export class RemoteMonitor implements RemoteMonitorManager {
  private static instance: RemoteMonitor;
  private clientHandler: WebSocket;
  private readonly address: string;
  private isRunning: boolean;

  private readonly onConnectionClosedEmitter: Emitter<
    MonitorEvents.ConnectionClosed
  > = new Emitter<MonitorEvents.ConnectionClosed>();
  readonly onConnectionClosed = this.onConnectionClosedEmitter.event;

  private readonly onMessageFromChipEmitter: Emitter<
    MonitorEventWithData
  > = new Emitter<MonitorEventWithData>();
  readonly onMessageFromChip = this.onMessageFromChipEmitter.event;

  public static init(): RemoteMonitor {
    if (!RemoteMonitor.instance) {
      RemoteMonitor.instance = new RemoteMonitor("ws://localhost:3362/monitor");
    }
    return RemoteMonitor.instance;
  }

  private constructor(addr: string) {
    this.address = addr;
  }

  public isMonitoring(): boolean {
    return this.isRunning;
  }

  async start() {
    const messageProtocol = new MessageProtocol("monitor");
    messageProtocol.add("monitor-type", MonitorType.Start);

    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        reject(new Error(MonitorErrors.AlreadyRunning));
      }
      this.isRunning = true;
      this.clientHandler = new WebSocket(this.address);
      this.clientHandler.onerror = (ev) => {
        this.isRunning = false;
        reject(ev);
      };
      this.clientHandler.onclose = (ev) => {
        this.isRunning = false;
        if (ev.reason === MonitorEvents.ConnectionClosedByUser) {
          console.log("monitor closed by user");
          return;
        }
        this.onConnectionClosedEmitter.fire(MonitorEvents.ConnectionClosed);
      };

      this.clientHandler.onmessage = (ev) => {
        this.getMsgFromChipHandler(ev);
      };

      this.clientHandler.onopen = () => {
        this.sendMessageToChip(serialize(messageProtocol.message));
        resolve(null);
      };
    });
  }

  async stop() {
    if (
      this.isRunning &&
      this.clientHandler.readyState === this.clientHandler.OPEN
    ) {
      this.clientHandler.close(3001, MonitorEvents.ConnectionClosedByUser);
    }
  }

  public sendMessageToChip(msg: Buffer) {
    if (this.clientHandler.readyState === this.clientHandler.OPEN) {
      this.clientHandler.send(msg);
    }
  }

  private async getMsgFromChipHandler(event: MessageEvent) {
    try {
      let data: any = event.data;
      if (data && data.arrayBuffer) {
        data = await data.arrayBuffer();
      }
      const message = deserialize(data);
      if (message && message["monitor-type"]) {
        switch (message["monitor-type"]) {
          case MonitorType.MessageFromChip:
            if (this.isRunning) {
              return this.onMessageFromChipEmitter.fire({
                event: MonitorType.MessageFromChip,
                data: message,
              });
            }
            this.onMessageFromChipEmitter.fire({
              event: MonitorType.MessageFromChip,
              data: message,
            });
            break;
          case MonitorType.MonitorError:
            return this.onMessageFromChipEmitter.fire({
              event: MonitorType.MonitorError,
              data: message,
            });
          default:
            break;
        }
      } else {
        return console.warn(
          "[Monitor 👀]: Unrecognized message received from the chip",
          message
        );
      }
    } catch (err) {
      console.log("[Monitor 👀]: Failed to parse the incoming message");
    }
  }
}
