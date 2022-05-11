import { ContainerModule } from "inversify";
import { MonitorWidget } from "./monitor-widget";
import {
  bindViewContribution,
  FrontendApplicationContribution,
  WidgetFactory,
} from "@theia/core/lib/browser";
import { EspRemoteMonitorWidgetContribution } from "./esp-remote-monitor-contribution";

import "../../src/browser/style/index.css";

export default new ContainerModule((bind) => {
  bindViewContribution(bind, EspRemoteMonitorWidgetContribution);
  bind(FrontendApplicationContribution).toService(
    EspRemoteMonitorWidgetContribution
  );
  bind(MonitorWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: MonitorWidget.ID,
      createWidget: () => ctx.container.get<MonitorWidget>(MonitorWidget),
    }))
    .inSingletonScope();
});
