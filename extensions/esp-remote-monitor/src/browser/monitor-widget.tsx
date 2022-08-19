import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
// import { serialize } from "bson";
import { MessageService } from "@theia/core";
// import { MessageProtocol } from "../common/message";
import { MonitorType } from "../common/monitor";
import { RemoteMonitor } from "./remoteMonitor";
// import { MonitorComponent } from "./components/monitor";
export interface MonitorMessage {
  type: MonitorType;
  message: any;
}

@injectable()
export class MonitorWidget extends ReactWidget {
  static readonly ID = "esp.remote.flasher.widget";
  static readonly LABEL = "Remote Flasher for ESP Chip";

  messages: Array<MonitorMessage>;

  @inject(MessageService)
  protected readonly messageService!: MessageService;

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = MonitorWidget.ID;
    this.title.label = MonitorWidget.LABEL;
    this.title.caption = MonitorWidget.LABEL;
    this.title.closable = true;
    this.title.iconClass = "fa fa-window-maximize";
    this.messages = new Array<MonitorMessage>();
    this.update();
  }

  private addNewMessage(message: MonitorMessage) {
    this.messages.push(message);
    this.update();
  }

  // private handleUserMsg(message: string) {
  //   const remoteMonitor = RemoteMonitor.init();
  //   if (remoteMonitor.isMonitoring()) {
  //     const msgProtocol = new MessageProtocol("monitor");
  //     msgProtocol.add("monitor-type", MonitorType.MessageToChip);
  //     msgProtocol.add("message", message);

  //     remoteMonitor.sendMessageToChip(serialize(msgProtocol.message));

  //     this.addNewMessage({
  //       type: MonitorType.MessageToChip,
  //       message,
  //     });
  //   }
  // }

  protected async onAfterAttach() {
    const remoteMonitor = RemoteMonitor.init();
    remoteMonitor.onMessageFromChip((ev) => {
      this.addNewMessage({
        type: ev.event,
        message: ev.data.message.toString(),
      });
    });
    remoteMonitor.onConnectionClosed(() => {
      this.messageService.warn(
        "Lost connection with the IDF Web IDE Desktop Companion App"
      );
      this.dispose();
    });

    try {
      if (!remoteMonitor.isMonitoring()) {
        await remoteMonitor.start();
      }
    } catch (error) {
      console.log(error);
      this.messageService.error("Error with IDF Web IDE Desktop Companion App");
      this.dispose();
    }
  }

  protected onBeforeDetach() {
    const remoteMonitor = RemoteMonitor.init();
    remoteMonitor.stop();
  }

  protected render(): React.ReactNode {
    // return (<MonitorComponent
    //   messages={this.messages}
    //   onNewMessage={(message: string) => this.handleUserMsg(message)}
    // />);
    return <div id='widget-container'>
            <button id='displayMessageButton' className='theia-button secondary' title='Display Message' >Display Message</button>
        </div>
  }
}
