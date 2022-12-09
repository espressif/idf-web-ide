import {
  Command,
  CommandContribution,
  CommandRegistry,
  ILogger,
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry,
  QuickInputService,
} from "@theia/core/lib/common";
import { MessageService } from "@theia/core/lib/common/message-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { inject, injectable } from "inversify";
import { IEspLoaderTerminal, ESPLoader, Transport } from "esptool-js";
import { OutputChannelManager } from "@theia/output/lib/browser/output-channel";
import { TerminalWidget } from "@theia/terminal/lib/browser/base/terminal-widget";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { EspWebSerialBackendService, PartitionInfo } from "../common/protocol";
import { enc, MD5 } from "crypto-js";

const EspWebSerialCommand: Command = {
  id: "EspWebSerial",
  label: "Connect device to Esptool",
};

const EspWebSerialFlashCommand: Command = {
  id: "EspWebSerialFlash",
  label: "Flash with WebSerial ⚡️",
};

const EspWebSerialMonitorCommand: Command = {
  id: "EspWebSerialMonitor",
  label: "Monitor with WebSerial ⚡️",
};

@injectable()
export class EspWebSerialCommandContribution implements CommandContribution {
  constructor(
    @inject(EspWebSerialBackendService)
    protected readonly espWebSerialBackendService: EspWebSerialBackendService,
    @inject(ILogger) protected readonly logger: ILogger,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(QuickInputService)
    private readonly quickInputService: QuickInputService,
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService,
    @inject(OutputChannelManager)
    protected readonly outputChannelManager: OutputChannelManager,
    @inject(TerminalService)
    protected readonly terminalService: TerminalService
  ) {}

  chip: any;
  connected = false;
  isConsoleClosed = false;
  transport: Transport;
  esploader: ESPLoader;
  terminal: TerminalWidget;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(EspWebSerialCommand, {
      execute: async () => {
        if (this.workspaceService.opened) {
          // const workspaceStat = this.workspaceService.tryGetRoots();
          const serial = (navigator as any).serial;
          if (!serial) {
            return undefined;
          }
          const port = await serial.requestPort();
          if (!port) {
            return undefined;
          }
          this.transport = new Transport(port);

          try {
            const items = [
              { label: "921600" },
              { label: "460800" },
              { label: "230400" },
              { label: "115200" },
            ];
            const selectedBaudRate =
              await this.quickInputService?.showQuickPick(items, {
                placeholder: "Choose connection baudrate",
              });
            const baudRate = selectedBaudRate
              ? parseInt(selectedBaudRate.label)
              : 921600;
            const outputChnl = await this.outputChannelManager.getChannel(
              "WebSerial Flash"
            );
            outputChnl.show();
            // this.terminal = await this.terminalService.newTerminal({
            //   id: "webserial-flash",
            //   title: "Serial connection with WebSerial",
            //   cwd: workspaceStat[0].resource.toString(),
            // });
            // await this.terminal.start();
            // this.terminalService.open(this.terminal);
            const clean = () => {
              // this.terminal.clearOutput();
              outputChnl.clear();
            };
            const writeLine = (data: string) => {
              // this.terminal.writeLine(data);
              outputChnl.appendLine(data);
            };
            const write = (data: string) => {
              // this.terminal.write(data);
              outputChnl.append(data);
            };

            const loaderTerminal: IEspLoaderTerminal = {
              clean,
              write,
              writeLine,
            };
            this.esploader = new ESPLoader(
              this.transport,
              baudRate,
              loaderTerminal
            );
            this.connected = true;
            this.chip = await this.esploader.main_fn();
          } catch (error) {
            const err = error && error.message ? error.message : error;
            console.log(error);
            this.messageService.error(err);
          }
        } else {
          this.messageService.info("Open a workspace first.");
        }
      },
    });

    registry.registerCommand(EspWebSerialFlashCommand, {
      execute: async () => {
        if (this.workspaceService.opened) {
          const workspaceStat = this.workspaceService.tryGetRoots();
          const progress = await this.messageService.showProgress({
            text: "Flashing with WebSerial...",
          });
          progress.report({
            message: "Getting binaries from project...",
            work: { done: 10, total: 100 },
          });
          try {
            const msgProtocol =
              await this.espWebSerialBackendService.getFlashSectionsForCurrentWorkspace(
                workspaceStat[0].resource.toString()
              );
            const fileArray = msgProtocol._message.sections as PartitionInfo[];
            const flashSize = msgProtocol._message.flash_size;
            const flashMode = msgProtocol._message.flash_mode;
            const flashFreq = msgProtocol._message.flash_freq;
            progress.report({
              message: `Flashing device (size: ${flashSize} mode: ${flashMode} frequency: ${flashFreq})...`,
            });
            await this.esploader.write_flash(
              fileArray,
              flashSize,
              flashMode,
              flashFreq,
              undefined,
              undefined,
              (fileIndex: number, written: number, total: number) => {
                progress.report({
                  message: `${fileArray[fileIndex].data} (${written}/${total})`,
                });
              },
              (image: string) => MD5(enc.Latin1.parse(image)).toString()
            );
            progress.cancel();
            this.messageService.info("Done flashing");
          } catch (error) {
            progress.cancel();
            const errMsg =
              error && error.message
                ? error.message
                : typeof error === "string"
                ? error
                : "Something went wrong";
            console.log(error);
            this.messageService.error(errMsg);
          }
        }
      },
    });

    registry.registerCommand(EspWebSerialMonitorCommand, {
      execute: async () => {
        if (this.transport === undefined) {
          const serial = navigator.serial;
          if (!serial) {
            return undefined;
          }
          const port = await serial.requestPort();
          if (!port) {
            return undefined;
          }
          this.transport = new Transport(port);
          await this.transport.connect();
        }

        try {
          this.terminal = await this.terminalService.newTerminal({
            id: "webserial-monitor",
            title: "Monitor with WebSerial",
          });
          await this.terminal.start();
          this.terminalService.open(this.terminal);
          this.isConsoleClosed = false;
          this.terminal.onDidDispose(() => {
            this.isConsoleClosed = true;
            this.transport.disconnect();
          });

          this.terminal.onKey((keyEvent) => {
            console.log(`terminal 'onKey' event: { key: '${keyEvent.key}', code: ${keyEvent.domEvent.code} }`)
            if (keyEvent.domEvent.code === "SIGINT") {
              this.isConsoleClosed = true;
              this.transport.disconnect();
            }
          });

          while (true && !this.isConsoleClosed) {
            let val = await this.transport.rawRead();
            if (typeof val !== "undefined") {
              let valStr = Buffer.from(val.buffer).toString();
              this.terminal.write(valStr);
            } else {
              break;
            }
          }
          await this.transport.waitForUnlock(1500);
        } catch (error) {
          const err = error && error.message ? error.message : error;
          console.log(error);
          this.messageService.error(err);
        }
      },
    });
  }
}

@injectable()
export class EspWebSerialMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    const REMOTE = [...MAIN_MENU_BAR, "10_remote"];
    menus.registerSubmenu(REMOTE, "Remote");
    menus.registerMenuAction(REMOTE, {
      commandId: EspWebSerialCommand.id,
      label: EspWebSerialCommand.label,
    });
    menus.registerMenuAction(REMOTE, {
      commandId: EspWebSerialFlashCommand.id,
      label: EspWebSerialFlashCommand.label,
    });
    menus.registerMenuAction(REMOTE, {
      commandId: EspWebSerialMonitorCommand.id,
      label: EspWebSerialMonitorCommand.label,
    });
  }
}
