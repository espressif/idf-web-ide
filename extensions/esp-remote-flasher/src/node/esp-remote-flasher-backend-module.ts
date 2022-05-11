import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { ContainerModule } from "inversify";
import {
  FlasherClient,
  EspFlasherBackendService,
  ESP_REMOTE_FLASHER,
} from "../common/protocol";
import { EspFlasherBackendServiceImpl } from "./esp-remote-flasher";

export default new ContainerModule((bind) => {
  bind(EspFlasherBackendService)
    .to(EspFlasherBackendServiceImpl)
    .inSingletonScope();
  bind(ConnectionHandler)
    .toDynamicValue(
      (ctx) =>
        new JsonRpcConnectionHandler<FlasherClient>(
          ESP_REMOTE_FLASHER,
          (client) => {
            const server = ctx.container.get<EspFlasherBackendServiceImpl>(
              EspFlasherBackendService
            );
            server.setClient(client);
            client.onDidCloseConnection(() => server.dispose());
            return server;
          }
        )
    )
    .inSingletonScope();
});
