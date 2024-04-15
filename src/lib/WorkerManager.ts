import * as express from "express";
import { Request, Response, NextFunction } from "express";

import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import cookieParser from "cookie-parser";
import sessions from "express-session";
import { BaseWorkerClass } from "./workers/BaseWorkerClass";

import { initialiseRedisConnection } from "./utils/RedisConfig";
import cronJobsProcessorWorker from "./workers/CronJobsProcessor/CronJobsProcessorWorker";
import { DEFAULTS } from "./utils/constants";
import { loginPageData } from "./utils/loginPage";

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
    this.app.use(this.queueUrl, this.verifyLogin, serverAdapter.getRouter());
    this.app.post(this.loginUrl, this.attemptLogin);
  }

  private verifyLogin(req: Request, res: Response, next: NextFunction) {
    const { session } = req as any;
    const loginHtml = loginPageData({
      loginUrl: this.loginUrl,
      queueUrl: this.queueUrl,
    });

    if (session.userid) {
      next();
    } else {
      res
        .set(
          "Content-Security-Policy",
          "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
        )
        .send(loginHtml);
    }
  }

  private attemptLogin(req: Request, res: Response) {
    console.log("attemptLogin", req.body);
    const username = this.config?.bullBoard?.username;
    const password = this.config?.bullBoard?.password;
    const { session } = req as any;

    if (req.body.username === username && req.body.password === password) {
      session.userid = req.body.username;
      res.json({ success: true });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }
  }
}
