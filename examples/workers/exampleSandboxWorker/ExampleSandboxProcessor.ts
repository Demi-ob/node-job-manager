import { SandboxedJob } from "bullmq";
import { ExampleSandboxProcessorWorkerDataType } from "./exampleSandboxProcessorWorker";

module.exports = async (
  job: SandboxedJob<ExampleSandboxProcessorWorkerDataType>
) => {
  const jobData = job.data;
  console.log(jobData);
};
