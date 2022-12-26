import { Event } from "@theia/core/lib/common";
import { MessageProtocol } from "./message";

export const EspWebSerialBackendService = Symbol("EspWebSerialBackendService");
export const ESP_WEBSERIAL_FLASHER = "/services/esp-webserial";

export interface EspWebSerialBackendService {
  getFlashSectionsForCurrentWorkspace(
    workspace: string
  ): Promise<MessageProtocol>;
}

export const WebSerialFlasherClient = Symbol("WebSerialBackendClient");

export interface WebSerialClient {
  connect(): Promise<string>;
  flash(data: Buffer): void;
  onDidCloseConnection: Event<FlashEvents.ConnectionClosed>;
  onFlashDone: Event<FlashEvents.FlashDone>;
  onFlassError: Event<FlashEvents.FlashError>;
  setIsFlashing(v: boolean): void;
}

export enum FlashErrors {
  BuildRequiredBeforeFlash = "BUILD_REQUIRED_BEFORE_FLASH",
  JsonFileParseError = "JSON_FILE_PARSE_ERROR",
}

export enum FlashEvents {
  ConnectionClosed = "connection-closed",
  FlashDone = "flash-done",
  FlashError = "flash-error",
}

export interface PartitionInfo {
  name: string;
  data: string;
  address: number;
}
