import { SandboxedJob } from "bullmq";
import { CronJobsProcessorWorkerDataType } from "./CronJobsProcessorWorker";
// https://docs.aws.amazon.com/en_us/chime/latest/dg/media-capture-events.html

module.exports = async (job: SandboxedJob<CronJobsProcessorWorkerDataType>) => {
  const jobData = job.data;
  const jobList = jobData?.jobList;

  console.log(
    `[CronJobsProcessor] started worker job.id=${job?.id}
      Cron uniqueId = ${jobData?.id}`,
    jobData
  );

  const id = jobData.id;
  const runMethod = jobList.find((job) => job.id === id)?.runMethod;

  if (!runMethod) {
    throw new Error(`[CronJobsProcessor] runMethod not found for id=${id}`);
  }
  runMethod();

  console.log(`[CronJobsProcessor] ended worker job.id=${job?.id}`);
};
