import { JsonRpcServer } from "@theia/core/lib/common/messaging";
import { Event } from "@theia/core/lib/common";
import { MessageProtocol } from "./message";

export const EspFlasherBackendService = Symbol("EspFlasherBackendService");
export const ESP_REMOTE_FLASHER = "/services/esp-remote-flasher";

export interface EspFlasherBackendService extends JsonRpcServer<FlasherClient> {
  getFlashSectionsForCurrentWorkspace(
    workspace: string
  ): Promise<MessageProtocol>;
}
export const FlasherClient = Symbol("BackendClient");
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
