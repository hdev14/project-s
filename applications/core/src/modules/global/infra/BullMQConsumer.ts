import Logger from '@global/app/Logger';
import Consumer, { ConsumerOptions } from '@shared/Consumer';
import types from '@shared/types';
import { Processor, Worker } from 'bullmq';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

@injectable()
export default class BullMQConsumer extends Consumer<Parameters<Processor>> {
  @inject(types.Logger)
  logger!: Logger;

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

    worker.on('completed', (job) => {
      this.logger.info(`Completed job ${job.id} successfully.`, job);
    });

    worker.on('failed', (job, error) => {
      this.logger.error(error, job);
    });
  }
}
