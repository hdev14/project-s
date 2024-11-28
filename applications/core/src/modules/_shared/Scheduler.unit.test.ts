import Scheduler from "./Scheduler";

jest.mock('node-cron');

describe('Scheduler unit tests', () => {
  const scheduler = Scheduler.getInstance();

  it('throws an error when trying to add the same cronjob', () => {
    scheduler.add('test', { cron_schedule: '* * * *', execute: function () { } });
    expect(() => {
      scheduler.add('test', { cron_schedule: '* * * *', execute: function () { } });
    }).toThrow('Cron already added');
  });
});
