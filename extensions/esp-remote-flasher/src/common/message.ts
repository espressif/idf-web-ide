import { v4 as uuidv4 } from "uuid";

export class MessageProtocol {
  public _message: { [key: string]: string };

  constructor(messageType: string) {
    this._message = {};
    this.addMandatoryFields(messageType);
  }

  public get message(): { [key: string]: string } {
    return this._message;
  }

  public add(key: string, value: any) {
    this._message[key] = value;
  }

  private addMandatoryFields(messageType: string) {
    this._message.version = "0.0.1";
    this._message.messageType = messageType;
    this._message._uuid = this.genUUID();
  }

  private genUUID(): string {
    return uuidv4();
  }
}