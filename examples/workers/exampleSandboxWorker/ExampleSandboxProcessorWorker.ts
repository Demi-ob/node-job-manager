import * as path from "path";
import { BaseWorkerClass } from "../../../src";

export type ExampleSandboxProcessorWorkerDataType = { key: string };

class ExampleSandboxProcessorWorker extends BaseWorkerClass<ExampleSandboxProcessorWorkerDataType> {
  constructor() {
    super({
      attempts: 1,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
  }

  protected exec = path.join(__dirname, "ExampleSandboxProcessor.ts");
}

const exampleSandboxProcessorWorker = new ExampleSandboxProcessorWorker();
export default exampleSandboxProcessorWorker;
