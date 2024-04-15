import * as nodeCron from "node-cron";
import { NodeCronTimezoneType } from "./cron/CronClassInterface";
import cronJobsProcessorWorker from "./workers/CronJobsProcessor/CronJobsProcessorWorker";
import { generateQueueJobId } from "./utils/utils";

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

interface CronManagerConfigInterface {
  jobs: CronJobInterface[];
  onError?: (opts: { job: CronJobInterface; message: string }) => void;
}

export class CronManager {
  private jobs: CronJobInterface[] = [];
  private onError: (opts: { job: CronJobInterface; message: string }) => void;
  constructor(config: CronManagerConfigInterface) {
    this.jobs = config.jobs;
    this.onError = config.onError || (() => {});
  }

  public async setupCron() {
    console.log("Setting up cron tasks", { length: this.jobs.length });
    this.jobs
      .filter((j) => j.active)
      .forEach((job) => {
        if (!nodeCron.validate(job.cronTab)) {
          console.log("Error in crontab", { job });
          this.onError({ job, message: "Error in crontab" });
          return;
        }

        const task = nodeCron.schedule(
          job.cronTab,
          () => {
            this.pushToCronQueue({
              name: job.name,
              id: job.id,
              jobId: generateQueueJobId(job.id),
            });
          },
          {
            scheduled: job.scheduled,
            timezone: job.timezone,
          }
        );

        task.start();
      });
    console.log("Setting up cron tasks completed", {
      length: this.jobs.length,
    });
  }

  private pushToCronQueue(opts: CronJobs) {
    const { id, jobId, name } = opts;
    cronJobsProcessorWorker.enqueue(
      name,
      { id, jobList: this.jobs },
      { jobId }
    );
    console.log(`unique_id: ${id}, queue jobId: ${jobId}`);
    console.log("adding to CronQueue");
  }
}
