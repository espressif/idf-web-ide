import { injectable, inject, postConstruct } from "inversify";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { PreviewUri } from "@theia/preview/lib/browser";
import { FrontendApplicationContribution, OpenerService, open } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
const WELCOME_PAGE_STORAGE_SERVICE_KEY = "esp_idf.welcomePageDisplayed"
@injectable()
export class ESPWelcomePageFrontendApplicationContribution implements FrontendApplicationContribution {
    private storageService: Storage | undefined;
    constructor(
        @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
        @inject(OpenerService) private readonly openerService: OpenerService,
    ) { }
    @postConstruct()
    init() {
        this.storageService = (window && window.localStorage) ? window.localStorage : undefined;
    }
    async onDidInitializeLayout() {
        if (this.workspaceService.opened) {
            if (this.storageService?.getItem(WELCOME_PAGE_STORAGE_SERVICE_KEY) === null) {
                const uri1 = new URI("/home/idf-web-ide//WELCOME.md");
                const uri2 = PreviewUri.encode(uri1);
                this.storageService?.setItem(WELCOME_PAGE_STORAGE_SERVICE_KEY, "true");
                open(this.openerService, uri2, { preview: true });
            }
        }
    }
}
