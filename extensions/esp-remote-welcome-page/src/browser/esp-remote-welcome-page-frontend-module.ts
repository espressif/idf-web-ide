import { ESPWelcomePageFrontendApplicationContribution } from './esp-remote-welcome-page-contribution';
import { FrontendApplicationContribution } from "@theia/core/lib/browser";

import { ContainerModule } from "inversify";

export default new ContainerModule(bind => {
    bind(FrontendApplicationContribution).to(ESPWelcomePageFrontendApplicationContribution);
});