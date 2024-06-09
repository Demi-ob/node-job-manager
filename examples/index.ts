import { Request, Response } from "express";
import express from "express";
import exampleWorker, {
  ExampleWorker,
} from "./workers/exampleWorker/ExampleWorker";
import { workerManager } from "./workerList";
import { getConnection } from "./Redis/redis_interface";

const app = express();

// setup worker
const wm = workerManager(app);
wm.setWorkers();
wm.setupBullBoard();
wm.setupCron();

setInterval(() => {
  exampleWorker().enqueue("asdsa", { key: "hey" });
  exampleWorker().enqueue("asdsa", { key: "hey" });
  exampleWorker().enqueue("asdsa", { key: "hey" });
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
