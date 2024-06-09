import * as path from "path";
import { BaseWorkerClass } from "../../../src";
import { connection, getConnection } from "../../Redis/redis_interface";
import IORedis from "ioredis";

export type ExampleSandboxProcessorWorkerDataType = { key: string };

class ExampleSandboxProcessorWorker extends BaseWorkerClass<ExampleSandboxProcessorWorkerDataType> {
  constructor(connection: IORedis) {
    super({
      connection: connection,
      attempts: 1,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
  }

  protected exec = path.join(__dirname, "ExampleSandboxProcessor.js");
}

const exampleSandboxProcessorWorker = () =>
  new ExampleSandboxProcessorWorker(getConnection());
export default exampleSandboxProcessorWorker;
