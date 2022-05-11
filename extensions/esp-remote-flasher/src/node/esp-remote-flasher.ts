import { createReadStream, pathExists, readJSON } from "fs-extra";
import { injectable } from "inversify";
import { join, parse } from "path";
import { MessageProtocol } from "../common/message";
import {
  EspFlasherBackendService,
  FlasherClient,
  FlashSectionInfo,
} from "../common/protocol";

@injectable()
export class EspFlasherBackendServiceImpl implements EspFlasherBackendService {
  public client: FlasherClient;
  private readonly flashInfoFileName: string = "flasher_args.json";

  getFlashSectionsForCurrentWorkspace(
    workspace: string,
  ): Promise<MessageProtocol> {
    return new Promise<MessageProtocol>(async (resolve, reject) => {
      const workspacePath = workspace.replace("file://", ""); //macosx file:// append issue with join().
      const flashInfoFileName = join(
        workspacePath,
        "build",
        this.flashInfoFileName
      );
      const isBuilt = await pathExists(flashInfoFileName);
      if (isBuilt) {
        try {
          const flashFileJson = await readJSON(flashInfoFileName);
          const binPromises: Promise<FlashSectionInfo | Error>[] = [];
          const results: { name: string; offset: string }[] = [];
          Object.keys(flashFileJson["flash_files"]).forEach((offset) => {
            const fileName = parse(flashFileJson["flash_files"][offset]).name;
            const filePath = join(workspacePath, "build", flashFileJson["flash_files"][offset]);
            results.push({ name: fileName, offset: filePath });
            binPromises.push(
              this.readFileIntoBuffer(filePath, fileName, offset)
            );
          });
          const binaries = await Promise.all(binPromises);
          const message = new MessageProtocol("flash");
          message.add("sections", binaries);
          const connResult = await this.client.connect();
          console.log(connResult);
          return resolve(message);
        } catch (error) {
          this.client.setIsFlashing(false);
          return reject(error.message);
        }
      } else {
        this.client.setIsFlashing(false);
        return reject("Build is required before flashing");
      }
    });
  }
  private async readFileIntoBuffer(
    filePath: string,
    name: string,
    offset: string
  ) {
    return new Promise<FlashSectionInfo | Error>((resolve, reject) => {
      const fileBuffer: Buffer[] = new Array<Buffer>();
      const stream = createReadStream(filePath);
      stream.on("data", (chunk: Buffer) => {
        fileBuffer.push(chunk);
      });
      stream.on("end", () => {
        const fileBufferResult: FlashSectionInfo = {
          bin: Buffer.concat(fileBuffer),
          name,
          offset,
        };
        return resolve(fileBufferResult);
      });
      stream.on("error", (err) => {
        return reject(err);
      });
    });
  }

  dispose(): void {
    // do nothing
  }
  setClient(client: FlasherClient): void {
    this.client = client;
  }
}
