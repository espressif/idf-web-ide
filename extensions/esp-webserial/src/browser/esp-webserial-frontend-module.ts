import { CommandContribution, MenuContribution } from "@theia/core";
import { ContainerModule } from "inversify";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";
import {
  EspWebSerialCommandContribution,
  EspWebSerialMenuContribution,
} from "./esp-webserial-frontend-contribution";
import {
  EspWebSerialBackendService,
  ESP_WEBSERIAL_FLASHER,
} from "../common/protocol";

export default new ContainerModule((bind) => {
  bind(CommandContribution)
    .to(EspWebSerialCommandContribution)
    .inSingletonScope();
  bind(MenuContribution).to(EspWebSerialMenuContribution);

  bind(EspWebSerialBackendService)
    .toDynamicValue((ctx) => {
      const connection = ctx.container.get(WebSocketConnectionProvider);
      return connection.createProxy<EspWebSerialBackendService>(
        ESP_WEBSERIAL_FLASHER
      );
    })
    .inSingletonScope();
});
