import * as express from "express";
import * as nodeCron from "node-cron";
import { NodeCronTimezoneType } from "./cron/CronClassInterface";
import { generateQueueJobId } from "./utils/utils";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import cookieParser from "cookie-parser";
import sessions from "express-session";
import { BaseWorkerClass } from "./workers/BaseWorkerClass";
import IORedis from "ioredis";

import { initialiseRedisConnection } from "./utils/RedisConfig";
import CronJobsProcessorWorker, {
  CronJobsProcessorWorkerDataType,
} from "./workers/CronJobsProcessor/CronJobsProcessorWorker";
import { DEFAULTS } from "./utils/constants";
import { attemptLogin, verifyLogin } from "./utils/loginPage";

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

export interface WorkerManagerConfigInterface {
  bullBoard: {
    username?: string;
    password?: string;
    cookieSecret?: string;
    pathPrefix?: string;
    sessionTimeout?: number;
  };
  cron?: { jobs: CronJobInterface[]; connection: IORedis; enable: boolean };
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
  private shouldSetupCron: boolean = false;
  private cronWorker:
    | BaseWorkerClass<CronJobsProcessorWorkerDataType>
    | undefined;
  constructor(opts: WorkerManagerOptsInterface) {
    this.workers = [...opts.workers] as const;
    if (opts.config.cron?.enable && !opts.config.cron?.connection) {
      throw new Error("Cron connection is required when enabled");
    }

    if (opts.config.cron?.enable) {
      this.cronWorker = new CronJobsProcessorWorker({
        connection: opts.config.cron.connection,
      });
      this.workers.push({
        worker: this.cronWorker,
        enableWorker: true,
      });
    }

    this.app = opts.app;
    this.config = opts.config;

    const pathPrefix =
      this.config.bullBoard?.pathPrefix || DEFAULTS.BULL_BOARD_PATH_PREFIX;
    this.queueUrl = `${pathPrefix}/queues`;
    this.loginUrl = `${pathPrefix}/login`;
  }

  public async setWorkers() {
    console.log("Setting up worker tasks", { length: this.workers.length });
    await this.workers.forEach((worker) => {
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
    const cron = this.config.cron;
    if (!this.cronWorker) {
      console.log("Cron worker not set");
      return;
    }

    if (!cron) {
      console.log("No crons to setup");
      return;
    }

    console.log("Setting up cron tasks", { length: cron?.jobs.length });
    cron?.jobs
      ?.filter((j) => j.active)
      ?.forEach((job) => {
        if (!nodeCron.validate(job.cronTab)) {
          console.log("Error in crontab", { job });
          this.config?.onError?.({ job, message: "Error in crontab" });
          return;
        }

        const task = nodeCron.schedule(
          job.cronTab,
          () => {
            this.cronWorker?.enqueue(
              job.name,
              { id: job.id, jobList: cron?.jobs },
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
      length: cron?.jobs.length,
    });
  }
}
