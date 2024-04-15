import * as express from "express";
import { Request, Response, NextFunction } from "express";
import * as nodeCron from "node-cron";
import { NodeCronTimezoneType } from "./cron/CronClassInterface";
import { generateQueueJobId } from "./utils/utils";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import cookieParser from "cookie-parser";
import sessions from "express-session";
import { BaseWorkerClass } from "./workers/BaseWorkerClass";

import { initialiseRedisConnection } from "./utils/RedisConfig";
import cronJobsProcessorWorker from "./workers/CronJobsProcessor/CronJobsProcessorWorker";
import { DEFAULTS } from "./utils/constants";
import { attemptLogin, loginPageData, verifyLogin } from "./utils/loginPage";
import { Job } from "bullmq";

interface CronJobs {
  name: string;
  id: string;
  jobId: string;
}
export interface CronJobInterface {
  id: string;
  runMethod: () => void;
  cronTab: string;
  name: string;
  active: boolean;
  timezone: NodeCronTimezoneType; // Available zone used by node-cron https://github.com/node-cron/tz-offset/blob/master/generated/offsets.json
  scheduled: boolean; // from node-cron. should default to true
}

export interface WorkerInterface {
  worker: BaseWorkerClass<any>;
  enableWorker: boolean;
}

const DEFAULT_WORKERS: WorkerInterface[] = [
  {
    worker: cronJobsProcessorWorker,
    enableWorker: true,
  },
];

export interface WorkerManagerConfigInterface {
  bullBoard: {
    username?: string;
    password?: string;
    cookieSecret?: string;
    pathPrefix?: string;
    sessionTimeout?: number;
  };
  redis: {
    port?: number;
    host?: string;
    username?: string;
    password?: string;
  };
  crons?: CronJobInterface[];
  onError?: (opts: { job: CronJobInterface; message: string }) => void;
}

export interface WorkerManagerOptsInterface {
  app: express.Express;
  workers: WorkerInterface[];
  config: WorkerManagerConfigInterface;
}

export class WorkerManager {
  private workers: WorkerInterface[] = [];
  private app: express.Express;

  private config: WorkerManagerConfigInterface;
  private loginUrl: string;
  private queueUrl: string;
  constructor(opts: WorkerManagerOptsInterface) {
    this.workers = [...DEFAULT_WORKERS, ...opts.workers] as const;
    this.app = opts.app;
    this.config = opts.config;

    const pathPrefix =
      this.config.bullBoard?.pathPrefix || DEFAULTS.BULL_BOARD_PATH_PREFIX;
    this.queueUrl = `${pathPrefix}/queues`;
    this.loginUrl = `${pathPrefix}/login`;
  }

  public async setWorkers() {
    console.log("Setting up worker tasks", { length: this.workers.length });
    await initialiseRedisConnection({
      ...this.config?.redis,
    });
    this.workers.forEach((worker) => {
      if (worker.enableWorker) {
        worker.worker.startListeningOnWorker();
      }
    });
    console.log("Setting up worker tasks completed", {
      length: this.workers.length,
    });
  }

  public async setupBullBoard() {
    const serverAdapter = new ExpressAdapter();

    createBullBoard({
      queues: this.workers.map((w) => {
        const queueData = w.worker.queueData().queue;
        return new BullMQAdapter(queueData);
      }),
      serverAdapter: serverAdapter,
    });
    serverAdapter.setBasePath("/bullmq/admin/queues");

    this.app.use(
      this.config?.bullBoard?.pathPrefix || DEFAULTS.BULL_BOARD_PATH_PREFIX,
      sessions({
        secret:
          this.config?.bullBoard?.cookieSecret ||
          DEFAULTS.BULL_BOARD_COOKIE_SECRET,
        saveUninitialized: true,
        cookie: {
          maxAge:
            this.config?.bullBoard?.sessionTimeout ||
            DEFAULTS.BULL_BOARD_SESSION_TIMEOUT,
        },
        // secure: true,
        resave: false,
      }),
      cookieParser()
    );
    this.app.use(
      this.queueUrl,
      verifyLogin({
        loginUrl: this.loginUrl,
        queueUrl: this.queueUrl,
      }),
      serverAdapter.getRouter()
    );
    
    this.app.post(
      this.loginUrl,
      attemptLogin({
        bullBoardUsername: this.config?.bullBoard?.username,
        bullBoardPassword: this.config?.bullBoard?.password,
      })
    );
  }

  public async setupCron() {
    const crons = this.config.crons;
    if (!crons) {
      console.log("No crons to setup");
      return;
    }
    console.log("Setting up cron tasks", { length: crons.length });
    crons
      .filter((j) => j.active)
      .forEach((job) => {
        if (!nodeCron.validate(job.cronTab)) {
          console.log("Error in crontab", { job });
          this.config?.onError?.({ job, message: "Error in crontab" });
          return;
        }

        const task = nodeCron.schedule(
          job.cronTab,
          () => {
            cronJobsProcessorWorker.enqueue(
              job.name,
              { id: job.id, jobList: crons },
              { jobId: generateQueueJobId(job.id) }
            );
          },
          {
            scheduled: job.scheduled,
            timezone: job.timezone,
          }
        );

        task.start();
      });
    console.log("Setting up cron tasks completed", {
      length: crons.length,
    });
  }
}
