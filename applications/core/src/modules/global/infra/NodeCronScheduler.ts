import Logger from "@global/app/Logger";
import Scheduler, { AddSchedulerParams } from "@global/app/Scheduler";
import types from "@shared/types";
import { inject, injectable } from "inversify";
import cron from 'node-cron';
import 'reflect-metadata';

@injectable()
export default class NodeCronScheduler implements Scheduler {
  constructor(@inject(types.Logger) private readonly logger: Logger) { }

  add(params: AddSchedulerParams): void {
    if (!cron.validate(params.cron_string)) {
      throw new Error('Cron string is invalid')
    }
    const task = cron.schedule(params.cron_string, params.handler, {
      timezone: 'America/Sao_Paulo',
    });

    task.on('task-finished', () => {
      this.logger.info(`Task ${params.name} has finished`);
    });

    task.on('task-failed', (error) => {
      this.logger.error(error);
    });

    task.start();
  }
}
