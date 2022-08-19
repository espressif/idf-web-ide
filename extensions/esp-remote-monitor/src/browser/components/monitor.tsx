import React = require('react');
import { MonitorType } from "../../common/monitor";
import { MonitorMessage } from "../monitor-widget";
import ansiToHTML = require("ansi-to-html");
import ReactHtmlParser from "react-html-parser";

export interface MonitorComponentProps {
  messages: Array<MonitorMessage>;
  onNewMessage: Function;
}

const converter = new ansiToHTML();

export class MonitorComponent extends React.Component<MonitorComponentProps> {
  messages(props: any): JSX.Element {
    const messages: Array<MonitorMessage> = props.messages;
    const htmlMessages = messages.map((m: MonitorMessage, i: number) => {
      if (m.type === MonitorType.MessageFromChip) {
        return (
          <div key={i}>{ReactHtmlParser(converter.toHtml(m.message))}</div>
        );
      }
      return (
        <div style={{ textAlign: "right" }} key={i}>
          {m.message}
          <span>&nbsp;&lt;</span>
        </div>
      );
    });
    return <div>{htmlMessages}</div>;
  }

  handleKeyDown(e: any) {
    if (e.key === "Enter") {
      const msg = document.getElementById("message") as HTMLInputElement;
      this.sendMessageToChip(msg.value);
      msg.value = "";
    }
  }

  handleClick() {
    const msg = document.getElementById("message") as HTMLInputElement;
    this.sendMessageToChip(msg.value);
    msg.value = "";
  }

  sendMessageToChip(message: string) {
    if (!message || message === "") {
      return;
    }
    this.props.onNewMessage(message);
    this.scrollToLatestMessage();
  }

  scrollToLatestMessage() {
    const messagesPane = document.getElementById("messagesPane");
    if (messagesPane) {
      messagesPane.scrollTop = messagesPane.scrollHeight;
    }
  }

  render(): React.ReactNode {
    return <div className="container is-fluid" style={{ height: 'inherit' }}>
        <div className="field is-grouped">
            <p className="control is-expanded">
                <input onKeyDown={_e => this.handleKeyDown(_e)} id="message" className="input fixed-height-2em" type="text" placeholder="Send message to the chip" />
            </p>
            <p className="control">
                <a className="button fixed-height-2em" onClick={_e => this.handleClick()}>Send</a>
            </p>
        </div>
        <div id="messagesPane" className="notification fixed-height-100-per-minus-4em is-scrollable background-transparent" style={{ backgroundColor: "transparent" }}>
            <this.messages messages={this.props.messages} />
        </div>
    </div>
  }
}
