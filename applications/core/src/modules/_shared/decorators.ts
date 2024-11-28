import Scheduler from './Scheduler';

export function Cron(cron_schedule: string) {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    const schedule = Scheduler.getInstance();
    const instance = new target.constructor();

    schedule.add(target.constructor.name, {
      cron_schedule,
      execute: descriptor.value.bind(instance),
    });
  }
}
