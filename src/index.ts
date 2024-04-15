import { Job } from "bullmq";

export {
  WorkerManager,
  WorkerInterface,
  WorkerManagerConfigInterface,
  WorkerManagerOptsInterface,
} from "./lib/WorkerManager";
export { CronManager, CronJobInterface } from "./lib/CronManager";
export { BaseWorkerClass } from "./lib/workers/BaseWorkerClass";
export { CronClassInterface } from "./lib/cron/CronClassInterface";

export type JobOpts<DataType> = Job<DataType>;
