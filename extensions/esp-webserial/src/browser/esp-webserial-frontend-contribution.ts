import {
  Command,
  CommandContribution,
  CommandRegistry,
  ILogger,
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry,
} from "@theia/core/lib/common";
import { CommandService } from "@theia/core/lib/common/command";
import { MessageService } from "@theia/core/lib/common/message-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { inject, injectable } from "inversify";

const EspWebSerialCommand: Command = {
  id: "EspWebSerial",
  label: "Flash ESP-IDF with WebSerial ⚡️",
};

@injectable()
export class EspWebSerialCommandContribution
  implements CommandContribution
{
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(ILogger) protected readonly logger: ILogger,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService
  ) {}

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(EspWebSerialCommand, {
      execute: async () => {
        if (this.workspaceService.opened) {
          // const workspaceStat = this.workspaceService.tryGetRoots();
          const usbPorts = this.commandService.executeCommand("workbench.experimental.requestUsbDevice");
          this.logger.info(JSON.stringify(usbPorts));
          // workbench.experimental.requestUsbDevice
          const serialPorts = this.commandService.executeCommand("workbench.experimental.requestSerialPort");
          this.logger.info(JSON.stringify(serialPorts));
        } else {
          this.messageService.info("Open a workspace first.");
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
  }
}
