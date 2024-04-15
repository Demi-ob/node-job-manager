import { WorkerInterface, WorkerManager } from "../src";
import exampleSandboxProcessorWorker from "./workers/exampleSandboxWorker/exampleSandboxProcessorWorker";
import exampleWorker from "./workers/exampleWorker/ExampleWorker";
import * as express from "express";

export const workerList: WorkerInterface[] = [
  {
    worker: exampleSandboxProcessorWorker,
    enableWorker: true,
  },
  {
    worker: exampleWorker,
    enableWorker: true,
  },
];

export const workerManager = (app: express.Express) =>
  new WorkerManager({
    app: app,
    workers: workerList,
    config: {
      bullBoard: {
        username: "test_username",
        password: "test_password",
      },
      redis: {
        username: "test_username",
        password: "test_password",
        host: "localhost",
        port: 6379,
      },
    },
  });
