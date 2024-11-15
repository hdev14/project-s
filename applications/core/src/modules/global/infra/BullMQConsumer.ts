import Consumer, { ConsumerOptions } from '@global/app/Consumer';
import { Processor, Worker } from 'bullmq';

export default class BullMQConsumer extends Consumer<Parameters<Processor>> {
  constructor(options: ConsumerOptions<Parameters<Processor>>) {
    super(options);

    const worker = new Worker(
      this.options.queue_name,
      this.options.handler,
      {
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT!, 10),
        },
        concurrency: 1,
      },
    );

    worker.on('completed', (job) => console.info(
      `Completed job ${job.id} successfully.`,
    ));

    worker.on('failed', (job, err) => console.error(
      `Failed job ${job?.id} with ${err}`
    ));
  }
}
