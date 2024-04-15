import { CronClassInterface } from "./CronClassInterface";

// Only the public method is required.
// add information about the cron to src/cron/jobs_list else it would not run

export class ExampleCron implements CronClassInterface {
  public async run() {}
}
