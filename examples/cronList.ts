import { CronJobInterface } from "../src/lib/CronManager";
import { ExampleCron } from "../src/lib/cron/ExampleCron";

export const jobs: CronJobInterface[] = [
  {
    id: "random_cron",
    name: "Some random name",
    cronTab: "0 0 * * *", //every day at 12am
    runMethod: () => {
      console.log("Job \n\n\n\n\n", new Date(), "\n\n");
    },
    active: true,
    timezone: "Africa/Algiers",
    scheduled: true,
  },
  {
    id: "example_cron_job",
    name: "Example cron job",
    cronTab: "*/10 * * * *", //every 10 minutes
    runMethod: new ExampleCron().run,
    active: true,
    timezone: "Africa/Algiers",
    scheduled: true,
  },
];

export const cronManager = new CronManager({
  jobs: jobs,
  onError: ({ job, message }) => {
    console.log("Error in cron", { job, message });
  },
});
