import { injectable, inject } from "inversify";
import { MessageService, MenuModelRegistry, MAIN_MENU_BAR } from "@theia/core";
import { AbstractViewContribution } from "@theia/core/lib/browser";
import { Command, CommandRegistry } from "@theia/core/lib/common/command";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { MonitorWidget } from "./monitor-widget";

export const EspRemoteMonitorCommand: Command = {
  id: "EspRemoteMonitor.command",
  label: "Start ESP Remote Monitor",
};

@injectable()
export class EspRemoteMonitorWidgetContribution extends AbstractViewContribution<
  MonitorWidget
> {
  constructor(
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,
    @inject(MessageService) private readonly messageService: MessageService
  ) {
    super({
      widgetId: MonitorWidget.ID,
      widgetName: MonitorWidget.LABEL,
      toggleCommandId: EspRemoteMonitorCommand.id,
      defaultWidgetOptions: {
        area: "bottom",
      },
    });
  }

  registerCommands(command: CommandRegistry) {
    command.registerCommand(EspRemoteMonitorCommand, {
      execute: async () => {
        if (!this.workspaceService.opened) {
          return this.messageService.error(
            "Open a ESP-IDF workspace folder first."
          );
        }
        super.openView({
          reveal: true,
          activate: false,
        });
      },
    });
  }

  registerMenus(menus: MenuModelRegistry) {
    const REMOTE = [...MAIN_MENU_BAR, "10_remote"];
    menus.registerSubmenu(REMOTE, "Remote");
    menus.registerMenuAction(REMOTE, {
      commandId: EspRemoteMonitorCommand.id,
      label: "Remote Monitor 👀",
    });
  }
}
