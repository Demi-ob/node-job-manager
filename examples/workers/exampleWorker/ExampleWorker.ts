import { Job } from "bullmq";
import { BaseWorkerClass } from "../../../src";

// How to create a worker
// queueName should be the class name to prevent to classes using the same queue
// only declare the processMethod, what should happen when a worker is called
// create a new item in src/workers/worker_list so that the startListeningOnWorker can be setup on app deployment
// change  ExampleWorkerDataType to the type/interface of the data that would be added to the queue
// Make sure to add super(queueName) to constructor

type ExampleWorkerDataType = { key: string };
const queueName = "ExampleWorker";

class ExampleWorker extends BaseWorkerClass<ExampleWorkerDataType> {
  constructor() {
    super({
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
  }

  exec = async (job: Job<ExampleWorkerDataType>): Promise<void> => {
    const jobData = job.data;
    console.log(
      `[ExampleWorkerDataType#processMethod] started worker job.id=${job?.id}`
    );
    // do something
    console.log("Doing nothing", jobData, job?.id);
    console.log(
      `[ExampleWorkerDataType#processMethod] ended worker job.id=${job?.id}`
    );
  };
}

const exampleWorker = new ExampleWorker();
export default exampleWorker;
