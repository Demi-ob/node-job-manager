/**
 * NOTE: Mongoose behaves weird in external sandbox environment like queries never resolving causing the await to wait forever
 * e.g https://github.com/OptimalBits/bull/issues/1356
 * https://stackoverflow.com/questions/48971500/mongoose-save-not-working-in-a-job-queue
 * One solution that might work is setting up connection in the processor file by calling   await MongoDbService.connectMongoPromise(1);
 before any operation
 *
 */
import { Job, JobsOptions, Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { connection } from "../utils/RedisConfig";

console.log("Initialising redis connection");

export class BaseWorkerClass<DataType> {
  public readonly queue: Queue;

  // queueEvents: QueueEvents;
  job: Job | undefined;
  public readonly queueName: string;

  constructor(opts?: JobsOptions) {
    opts = opts || {};
    this.queueName = this.constructor.name;
    console.log("Initialising queue", this.queueName);
    this.queue = new Queue(this.queueName, {
      connection: connection!,
      defaultJobOptions: opts,
    });
  }

  public queueData() {
    return {
      queue: this.queue,
      connection: connection,
      queueName: this.queueName,
    };
  }

  private async initialiseWorker() {
    /**
     *  Logic here was moved away from constructor for performance benefit
     *  when the intention of the instantiated class object is to produce and not consume (create worker)
     */
    // You need at least one QueueScheduler running somewhere for a given queue
    // if you require functionality such as delayed jobs, retries with backoff and rate limiting.
    // https://docs.bullmq.io/guide/queuescheduler
    // const queueScheduler = new QueueScheduler(this.queueName, {
    //   connection,
    // })
    // await queueScheduler.waitUntilReady()
    // NOTE: Using queueEvents did not allow performAsync promise to resolve until the process was actually completed which defeats the purpose of having an async worker
    // this.queueEvents = new QueueEvents(this.queueName, {
    //   connection,
    // });
    // this.queueEvents.on("failed", this.onFailed);
    // this.queueEvents.on("completed", this.onCompleted);
  }

  public readonly performAsync = async (
    name: string,
    data: DataType,
    opts?: JobsOptions
  ): Promise<void> => {
    console.log(`PerformAsync called for queueName=${this.queueName}`);
    await this.queue.add(name, data, opts);
  };

  public readonly startListeningOnWorker = async () => {
    await this.initialiseWorker();
    const processor =
      typeof this.processMethod === "string"
        ? this.processMethod
        : this.wrappedProcessMethod;
    const worker = new Worker<DataType>(this.queueName, processor, {
      connection: connection!,
      concurrency: 50,
    });
    worker.on("completed", (job) => {
      console.log(`Job with ${job.id} completed on queue: ${this.queueName}`);
    });
    worker.on("failed", (job, err) => {
      console.log(
        `Job with ${job?.id} failed on queue: ${this.queueName} with message = ${err.message}`
      );
    });
  };

  /**
   *  Process method or file to process worker
   *  https://docs.bullmq.io/guide/queuescheduler
   * @protected
   */
  protected processMethod: ((job: Job<DataType>) => Promise<void>) | string =
    async (job: Job<DataType>): Promise<void> => {
      throw new Error(
        `${this.constructor.name} processMethod must be overwritten`
      );
    };

  private wrappedProcessMethod = async (job: Job<DataType>): Promise<void> => {
    console.log(
      `started processing worker job.id=${job.id}, queue=${this.queueName}`
    );
    this.job = job;
    if (typeof this.processMethod === "string") {
      const msg = `[BaseWorkerClass#wrappedProcessMethod] processMethod should not be called for string queueName=${this.queueName}`;
      console.log(msg);
      throw new Error(msg);
    }
    await this.processMethod(job);
    console.log(
      `Finished processing worker job.id=${job.id}, queue=${this.queueName}`
    );
  };

  // public async onCompleted(jobId: string) {
  //   console.log(`Job with ${jobId} completed on queue: ${this.queueName}`);
  // }
  //
  // public async onFailed(jobId: string, err) {
  //   console.log(`Job with ${jobId} failed on queue: ${this.queueName}`, err);
  // }
}
