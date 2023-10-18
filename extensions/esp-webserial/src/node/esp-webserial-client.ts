import { injectable } from "inversify";
import { pathExists, readJSON, readFile } from "fs-extra";
import { join, parse } from "path";
import { EspWebSerialBackendService, PartitionInfo } from "../common/protocol";
import { MessageProtocol } from "../common/message";

@injectable()
export class EspWebSerialBackendServiceImpl
  implements EspWebSerialBackendService
{
  private readonly flashInfoFileName: string = "flasher_args.json";

  getFlashSectionsForCurrentWorkspace(workspace: string) {
    return new Promise<MessageProtocol>(async (resolve, reject) => {
      const workspacePath = workspace.replace("file://", "");
      const flashInfoFileName = join(
        workspacePath,
        "build",
        this.flashInfoFileName
      );
      const isBuilt = await pathExists(flashInfoFileName);
      if (!isBuilt) {
        return reject("Build before flashing");
      }
      const flashFileJson = await readJSON(flashInfoFileName);
      const binPromises: Promise<PartitionInfo | Error>[] = [];
      Object.keys(flashFileJson["flash_files"]).forEach((offset) => {
        const fileName = parse(flashFileJson["flash_files"][offset]).name;
        const filePath = join(
          workspacePath,
          "build",
          flashFileJson["flash_files"][offset]
        );
        binPromises.push(this.readFileIntoBuffer(filePath, fileName, offset));
      });
      const binaries = await Promise.all(binPromises);
      const message = new MessageProtocol("flash");
      message.add("sections", binaries);
      message.add("flash_size", flashFileJson["flash_settings"]["flash_size"]);
      message.add("flash_mode", flashFileJson["flash_settings"]["flash_mode"]);
      message.add("flash_freq", flashFileJson["flash_settings"]["flash_freq"]);
      return resolve(message);
    });
  }

  private async readFileIntoBuffer(
    filePath: string,
    name: string,
    offset: string
  ) {
    const fileData = await readFile(filePath, "binary");
    return {
      data: fileData,
      name,
      address: parseInt(offset),
    } as PartitionInfo;
  }

  dispose(): void {}
}
