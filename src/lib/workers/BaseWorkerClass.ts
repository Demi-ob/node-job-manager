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

console.log("Initialising redis connection");

export abstract class BaseWorkerClass<DataType> {
  public readonly queue: Queue;

  // queueEvents: QueueEvents;
  job: Job | undefined;
  public readonly queueName: string;

  constructor(private opts: JobsOptions & { connection: IORedis }) {
    // opts = opts || {};
    this.queueName = this.constructor.name;
    console.log("Initialising queue", this.queueName);
    this.queue = new Queue(this.queueName, {
      connection: opts.connection,
      defaultJobOptions: opts,
    });
  }

  public queueData() {
    return {
      queue: this.queue,
      connection: this.opts?.connection,
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
    // NOTE: Using queueEvents did not allow enqueue promise to resolve until the process was actually completed which defeats the purpose of having an async worker
    // this.queueEvents = new QueueEvents(this.queueName, {
    //   connection,
    // });
    // this.queueEvents.on("failed", this.onFailed);
    // this.queueEvents.on("completed", this.onCompleted);
  }

  public readonly enqueue = async (
    name: string,
    data: DataType,
    opts?: JobsOptions
  ): Promise<void> => {
    console.log(`enqueue called for queueName=${this.queueName}`);
    await this.queue.add(name, data, opts);

    /**
 * NOTE: An error occurs when you call the  await this.queue.add(name, data, opts); multiple times with the same connection object
 * Even if we use multiple queues the issue persists. 
 * The current hack is to create a new connection object for each call rather than using a cached connection
 * 
 * The error message looks like this:
 * ReplyError: ERR user_script:45: Bad data format in input. script: 9b67b263800b6f824ebff3728c865ac78083a12b, on @user_script:45.
    at parseError (/projects/job-manager/node_modules/redis-parser/lib/parser.js:179:12)
    at parseType (/projects/job-manager/node_modules/redis-parser/lib/parser.js:302:14) {
  command: {
    name: 'evalsha',
    args: [
      '9b67b263800b6f824ebff3728c865ac78083a12b',
      '7',
      'bull:ExampleWorker:wait',
      'bull:ExampleWorker:paused',
 * 
 */
  };

  public readonly startListeningOnWorker = async () => {
    await this.initialiseWorker();
    const processor =
      typeof this.exec === "string" ? this.exec : this.wrappedProcessMethod;
    const worker = new Worker<DataType>(this.queueName, processor, {
      connection: this.opts?.connection,
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
  protected abstract exec: ((job: Job<DataType>) => Promise<void>) | string;

  private wrappedProcessMethod = async (job: Job<DataType>): Promise<void> => {
    console.log(
      `[${this.constructor.name}#exec] started processing worker job.id=${job.id}, queue=${this.queueName}`
    );
    this.job = job;
    if (typeof this.exec === "string") {
      const msg = `BaseWorkerClass [${this.constructor.name}#exec] exec should not be called for string queueName=${this.queueName}`;
      console.log(msg);
      throw new Error(msg);
    }
    await this.exec(job);
    console.log(
      `[${this.constructor.name}#exec] Finished processing worker job.id=${job.id}, queue=${this.queueName}`
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
