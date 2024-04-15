import { CronJobInterface } from "../../CronManager";
import { BaseWorkerClass } from "../BaseWorkerClass";
import * as path from "path";
// https://docs.aws.amazon.com/en_us/chime/latest/dg/media-capture-events.html

export type CronJobsProcessorWorkerDataType = {
  id: string;
  jobList: CronJobInterface[];
};

class CronJobsProcessorWorker extends BaseWorkerClass<CronJobsProcessorWorkerDataType> {
  constructor() {
    super({
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
  }

  processMethod = path.join(__dirname, "CronJobsProcessor.ts");
}

const cronJobsProcessorWorker = new CronJobsProcessorWorker();
export default cronJobsProcessorWorker;
