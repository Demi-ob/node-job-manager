import { CronJobInterface, WorkerInterface, WorkerManager } from "../src";
import { ExampleCron } from "../src/lib/cron/ExampleCron";
import exampleSandboxProcessorWorker from "./workers/exampleSandboxWorker/ExampleSandboxProcessorWorker";
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

export const jobs: CronJobInterface[] = [
  {
    id: "random_cron",
    name: "Some random name",
    cronTab: "0 0 * * *", //every day at 12am
    runMethod: () => {
      console.log("Job \n\n\n\n\n", new Date(), "\n\n");
    },
    active: true,
    timezone: "Africa/Algiers",
    scheduled: true,
  },
  {
    id: "example_cron_job",
    name: "Example cron job",
    cronTab: "*/10 * * * *", //every 10 minutes
    runMethod: new ExampleCron().run,
    active: true,
    timezone: "Africa/Algiers",
    scheduled: true,
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
      onError: ({ job, message }) => {
        console.log("Error in cron", { job, message });
      },
      crons: jobs,
    },
  });
