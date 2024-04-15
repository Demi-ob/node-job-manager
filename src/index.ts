import { Job } from "bullmq";

export {
  WorkerManager,
  WorkerInterface,
  WorkerManagerConfigInterface,
  WorkerManagerOptsInterface,
  CronJobInterface,
} from "./lib/WorkerManager";
export { BaseWorkerClass } from "./lib/workers/BaseWorkerClass";
export { CronClassInterface } from "./lib/cron/CronClassInterface";

export type JobOpts<DataType> = Job<DataType>;
