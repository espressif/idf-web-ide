export enum MonitorType {
  Start = "start",
  Stop = "stop",
  MessageFromChip = "message-from-chip",
  MessageToChip = "message-to-chip",
  MonitorError = "monitor-error",
}

export enum MonitorEvents {
  ConnectionClosed = "connection-closed",
  ConnectionClosedByUser = "connection-closed-by-user",
  MonitorError = "monitor-error",
  MessageFromChip = "message-from-chip",
  MessageFromChipWithoutListener = "message-from-chip-without-listener",
}

export interface MonitorEventWithData {
  event: MonitorType;
  data: any;
}

export enum MonitorErrors {
  AlreadyRunning = "monitor-already-running",
}

export interface RemoteMonitorManager {
  start(): any;
  stop(): any;
}