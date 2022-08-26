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
import { ESPLoader } from "../esptooljs/esploader.js";
import { Transport } from "../esptooljs/webserial.js";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { TerminalWidget } from "@theia/terminal/lib/browser/base/terminal-widget";
import { EspWebSerialBackendService } from "../common/protocol";
import { enc, MD5 } from "crypto-js";

const EspWebSerialCommand: Command = {
  id: "EspWebSerial",
  label: "Connect device to Esptool",
};

const EspWebSerialFlashCommand: Command = {
  id: "EspWebSerialFlash",
  label: "Flash with WebSerial ⚡️",
};

@injectable()
export class EspWebSerialCommandContribution implements CommandContribution {
  // @inject(CommandService) private readonly commandService: CommandService,
  constructor(
    @inject(EspWebSerialBackendService)
    protected readonly espWebSerialBackendService: EspWebSerialBackendService,
    @inject(ILogger) protected readonly logger: ILogger,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(QuickInputService)
    private readonly quickInputService: QuickInputService,
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService,
    @inject(TerminalService)
    protected readonly terminalService: TerminalService
  ) {}

  chip: any;
  connected = false;
  esploader: ESPLoader;
  terminal: TerminalWidget;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(EspWebSerialCommand, {
      execute: async () => {
        if (this.workspaceService.opened) {
          const workspaceStat = this.workspaceService.tryGetRoots();
          const serial = (navigator as any).serial;
          if (!serial) {
            return undefined;
          }
          const port = await serial.requestPort();
          if (!port) {
            return undefined;
          }
          const transport = new Transport(port);

          try {
            const items = [
              { label: "921600" },
              { label: "460800" },
              { label: "230400" },
              { label: "115200" },
            ];
            const selectedBaudRate = await this.quickInputService?.showQuickPick(items, { placeholder: "Choose connection baudrate"});
            const baudRate = selectedBaudRate ? parseInt(selectedBaudRate.label) : 921600;
            this.terminal = await this.terminalService.newTerminal({
              id: "webserial-flash",
              title: "Serial connection with WebSerial",
              cwd: workspaceStat[0].resource.toString(),
            });
            await this.terminal.start();
            this.terminalService.open(this.terminal);
            this.esploader = new ESPLoader(transport, baudRate, this.terminal);
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
            const fileArray = msgProtocol._message.sections;
            const flashSize = msgProtocol._message.flash_size;
            const flashMode = msgProtocol._message.flash_mode;
            const flashFreq = msgProtocol._message.flash_freq;
            progress.report({
              message: `Flashing device (size: ${flashSize} mode: ${flashMode} frequency: ${flashFreq})...`,
            });
            await this.esploader.write_flash({
              fileArray,
              flash_size: flashSize,
              flash_mode: flashMode,
              flash_freq: flashFreq,
              reportProgress: (
                fileIndex: number,
                written: number,
                total: number
              ) => {
                progress.report({
                  message: `${fileArray[fileIndex].name} (${written}/${total})`,
                });
              },
              calculateMD5Hash: (image: string) => MD5(enc.Latin1.parse(image)),
            });
            progress.cancel();
            this.messageService.info("Done flashing");
          } catch (error) {
            this.messageService.error(error);
            progress.cancel();
          }
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
  }
}
