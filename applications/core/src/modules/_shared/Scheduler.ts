import cron from 'node-cron';

export interface CronJob {
  execute(): Promise<any> | any;
}

type CronOptions = {
  cron_schedule: string;
  execute: () => Promise<any> | any;
};

// singleton
export default class Scheduler {
  private static instance?: Scheduler;
  private crons: Map<string, CronOptions> = new Map();

  private constructor() { }

  static getInstance() {
    if (Scheduler.instance !== undefined) {
      return Scheduler.instance;
    }

    Scheduler.instance = new Scheduler();

    return Scheduler.instance;
  }

  add(name: string, cron_job: CronOptions) {
    if (!cron.validate(cron_job.cron_schedule)) {
      throw new Error('Cron string is invalid')
    }

    if (this.crons.has(name)) {
      throw new Error('Cron already added');
    }

    this.crons.set(name, cron_job);
  }

  init() {
    for (const [key, value] of this.crons.entries()) {
      const task = cron.schedule(value.cron_schedule, value.execute, {
        name: key,
        timezone: 'America/Sao_Paulo',
      });

      task.start();
    }
  }
}
