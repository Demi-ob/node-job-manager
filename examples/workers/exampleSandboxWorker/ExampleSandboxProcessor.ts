import { SandboxedJob } from "bullmq";
import { ExampleSandboxProcessorWorkerDataType } from "./ExampleSandboxProcessorWorker";

module.exports = async (
  job: SandboxedJob<ExampleSandboxProcessorWorkerDataType>
) => {
  const jobData = job.data;
  console.log(jobData);
};
