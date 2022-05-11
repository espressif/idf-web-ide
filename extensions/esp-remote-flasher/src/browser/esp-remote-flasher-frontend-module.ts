import { CommandContribution, MenuContribution } from "@theia/core";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { ContainerModule } from "inversify";
import {
  FlasherClient,
  EspFlasherBackendService,
  ESP_REMOTE_FLASHER,
} from "../common/protocol";
import { EspRemoteFlasherCommandContribution, EspRemoteFlasherMenuContribution } from "./esp-remote-flasher-frontend-contribution";
import { FlasherClientImpl } from "./remoteFlasher";

export default new ContainerModule((bind) => {
  bind(CommandContribution)
    .to(EspRemoteFlasherCommandContribution)
    .inSingletonScope();
  bind(MenuContribution).to(EspRemoteFlasherMenuContribution);
  bind(FlasherClient)
    .to(FlasherClientImpl)
    .inSingletonScope();

  bind(EspFlasherBackendService)
    .toDynamicValue((ctx) => {
      const connection = ctx.container.get(WebSocketConnectionProvider);
      const backendClient: FlasherClient = ctx.container.get(FlasherClient);
      return connection.createProxy<EspFlasherBackendService>(
        ESP_REMOTE_FLASHER,
        backendClient
      );
    })
    .inSingletonScope();
});
