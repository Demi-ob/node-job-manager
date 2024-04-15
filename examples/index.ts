import { Request, Response, Router } from "express";
import { CronManager, WorkerInterface, WorkerManager } from "../src";
import express from "express";
import exampleSandboxProcessorWorker from "./workers/exampleSandboxWorker/exampleSandboxProcessorWorker";
import exampleWorker from "./workers/exampleWorker/ExampleWorker";
import { workerList, workerManager } from "./workerList";
import { ExampleCron } from "../src/lib/cron/ExampleCron";
import { CronJobInterface } from "../src/lib/CronManager";
import { cronManager, jobs } from "./cronList";

const app = express();

// setup worker
const wm = workerManager(app);
wm.setWorkers();
wm.setupBullBoard();

// setup cron
const cm = cronManager;
cm.setupCron();

setInterval(() => {
  exampleWorker.performAsync("asdsa", { key: "hey" });
}, 3000);

app.use("/health", (req: Request, res: Response) => {
  const message = `====>  Health check server running on ${
    process.env.NODE_ENV
  }... ${new Date().toString()}`;
  res.send({ message });
});

const PORT = 8080;
const server = app.listen(PORT, () => {
  console.log("  App is running at http://localhost:%d", PORT);
  console.log("  Press CTRL-C to stop\n");
});
