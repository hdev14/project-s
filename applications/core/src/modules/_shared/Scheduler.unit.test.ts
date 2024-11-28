import { faker } from '@faker-js/faker';
import Scheduler from "./Scheduler";

describe('Scheduler unit tests', () => {
  const scheduler = Scheduler.getInstance();

  it('throws an error when trying to add the same cronjob', () => {
    scheduler.add('test', { cron_schedule: '* * * * *', execute: function () { } });

    expect(() => {
      scheduler.add('test', { cron_schedule: '* * * * *', execute: function () { } });
    }).toThrow('Cron already added');
  });

  it('should throw an error if cron_schedule is invalid', () => {
    expect(() => {
      scheduler.add(faker.string.sample(), { cron_schedule: '*', execute: function () { } });
    }).toThrow(new Error('Cron string is invalid'));
  });
});
