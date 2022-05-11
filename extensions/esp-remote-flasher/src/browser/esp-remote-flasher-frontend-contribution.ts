import {
  Command,
  CommandContribution,
  CommandRegistry,
  ILogger,
  MAIN_MENU_BAR,
  MenuContribution,
  MenuModelRegistry
} from "@theia/core/lib/common";
import { MessageService } from "@theia/core/lib/common/message-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { inject, injectable } from "inversify";
import { EspFlasherBackendService } from "../common/protocol";
import { FlasherClientImpl } from "./remoteFlasher";
import { serialize } from "bson";

const EspRemoteFlasherCommand: Command = {
  id: "EspRemoteFlasher",
  label: "Remote flasher for ESP",
};

@injectable()
export class EspRemoteFlasherCommandContribution
  implements CommandContribution {
  constructor(
    @inject(EspFlasherBackendService)
    private readonly espFlasherBackendService: EspFlasherBackendService,
    @inject(ILogger)
    protected readonly logger: ILogger,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService
  ) {}

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(EspRemoteFlasherCommand, {
      execute: async () => {
        if (this.workspaceService.opened) {
          const workspaceStat = this.workspaceService.tryGetRoots();
          const flasher = FlasherClientImpl.init();

          const progress = await this.messageService.showProgress(
            {
              text: "Connecting to Flasher Daemon",
            },
            () => {
              flasher?.setIsFlashing(false);
            }
          );
          flasher?.setIsFlashing(true);

          flasher?.onDidCloseConnection(() => {
            flasher?.setIsFlashing(false);
            progress.cancel();
            this.messageService.error(
              "Lost connection with the Chip, make sure the desktop flasher tool is running with all the permissions"
            );
          });

          flasher?.onFlashDone(() => {
            flasher?.setIsFlashing(false);
            progress.cancel();
            this.messageService.info("Done flashing");
          });

          flasher?.onFlassError(() => {
            flasher?.setIsFlashing(false);
            progress.cancel();
            this.messageService.error(
              `Flashing failed. Check local flasher output.\n`
            );
          });

          progress.report({
            message: "Getting binaries from project...",
            work: { done: 10, total: 100 },
          });

          try {
            const msgProtocol = await this.espFlasherBackendService.getFlashSectionsForCurrentWorkspace(
              workspaceStat[0].resource.toString()
            );
            const bsonMsg = serialize(msgProtocol._message);
            flasher?.flash(bsonMsg);
            progress.report({
              message:
                "Flashing request sent to the Chip, waiting for response",
              work: { done: 80, total: 100 },
            });
          } catch (error) {
            this.messageService.error(error);
          }
        } else {
          this.messageService.info("Open a workspace first.");
        }
      },
    });
  }
}

@injectable()
export class EspRemoteFlasherMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        const REMOTE = [...MAIN_MENU_BAR, "10_remote"];
        menus.registerSubmenu(REMOTE, "Remote");
        menus.registerMenuAction(REMOTE, {
            commandId: EspRemoteFlasherCommand.id,
            label: 'Remote Flash ⚡️'
        });
    }
}