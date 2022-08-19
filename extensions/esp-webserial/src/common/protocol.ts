import { JsonRpcServer } from "@theia/core/lib/common/messaging";
import { Event } from "@theia/core/lib/common";

export const EspWebSerialBackendService = Symbol("EspWebSerialBackendService");
export const ESP_REMOTE_FLASHER = "/services/esp-webserial";

export interface EspWebSerialBackendService extends JsonRpcServer<FlasherClient> {
  getFlashSectionsForCurrentWorkspace(
    workspace: string
  ): Promise<any>;
}

export const WebSerialFlasherClient = Symbol("WebSerialBackendClient");

export interface FlasherClient {
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

export interface FlashSectionInfo {
  name: string;
  bin: Buffer;
  offset: string;
}
