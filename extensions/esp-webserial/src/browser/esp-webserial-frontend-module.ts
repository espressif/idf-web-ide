import { CommandContribution, MenuContribution } from "@theia/core";
import { ContainerModule } from "inversify";
import { EspWebSerialCommandContribution, EspWebSerialMenuContribution } from "./esp-webserial-frontend-contribution";

export default new ContainerModule((bind) => {
  bind(CommandContribution)
    .to(EspWebSerialCommandContribution)
    .inSingletonScope();
  bind(MenuContribution).to(EspWebSerialMenuContribution);
});
