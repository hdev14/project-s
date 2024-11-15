import Queue, { Message, QueueOptions } from "@shared/Queue";
import bullmq from 'bullmq';
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class BullMQueue extends Queue {
  private readonly queue: bullmq.Queue;

  constructor(options: QueueOptions) {
    super(options);

    this.queue = new bullmq.Queue(this.options.queue, {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!, 10),
      },
      defaultJobOptions: {
        attempts: this.options.attempts,
      },
    });
  }

  public async addMessage(message: Message): Promise<void> {
    await this.queue.add(message.name, message);
  }

  public async addMessages(messages: Message[]): Promise<void> {
    const jobs = [];

    for (let idx = 0; idx < messages.length; idx++) {
      const message = messages[idx];
      jobs.push({ name: message.name, data: message });
    }

    await this.queue.addBulk(jobs);
  }
}
