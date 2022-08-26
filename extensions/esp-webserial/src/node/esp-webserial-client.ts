import { injectable } from "inversify";
import { createReadStream, pathExists, readJSON } from "fs-extra";
import { join, parse } from "path";
import {
  EspWebSerialBackendService,
  PartitionInfo
} from "../common/protocol";
import { MessageProtocol } from "../common/message";

@injectable()
export class EspWebSerialBackendServiceImpl implements EspWebSerialBackendService {
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
        return reject("Build before flashing")
      }
      const flashFileJson = await readJSON(flashInfoFileName);
      const binPromises: Promise<PartitionInfo | Error>[] = [];
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
    return new Promise<PartitionInfo | Error>((resolve, reject) => {
      const fileBuffer: Buffer[] = new Array<Buffer>();
      const stream = createReadStream(filePath);
      stream.on("data", (chunk: Buffer) => {
        fileBuffer.push(chunk);
      });
      stream.on("end", () => {
        const fileBufferResult: PartitionInfo = {
          data: Buffer.concat(fileBuffer).toString(),
          name,
          address: parseInt(offset),
        };
        return resolve(fileBufferResult);
      });
      stream.on("error", (err) => {
        return reject(err);
      });
    });
  }

  dispose(): void {
    
  }
}
