import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { ContainerModule } from "inversify";
import {
  EspWebSerialBackendService,
  ESP_WEBSERIAL_FLASHER,
} from "../common/protocol";
import { EspWebSerialBackendServiceImpl } from "./esp-webserial-client";

export default new ContainerModule((bind) => {
  bind(EspWebSerialBackendService)
    .to(EspWebSerialBackendServiceImpl)
    .inSingletonScope();
  bind(ConnectionHandler)
    .toDynamicValue(
      (ctx) =>
        new JsonRpcConnectionHandler(ESP_WEBSERIAL_FLASHER, () => {
          return ctx.container.get<EspWebSerialBackendService>(
            EspWebSerialBackendService
          );
        })
    )
    .inSingletonScope();
});
