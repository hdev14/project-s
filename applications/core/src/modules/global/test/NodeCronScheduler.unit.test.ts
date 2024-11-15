import { faker } from "@faker-js/faker";
import Logger from "@global/app/Logger";
import NodeCronScheduler from "@global/infra/NodeCronScheduler";
import { mock } from "jest-mock-extended";
import cron from 'node-cron';

jest.mock('node-cron');
const cron_mocked = jest.mocked(cron);

describe('NodeCronScheduler unit tests', () => {
  const logger_mock = mock<Logger>();
  const scheduler = new NodeCronScheduler(logger_mock);

  it('should throw an error if cron_string is invalid', () => {
    cron_mocked.validate.mockReturnValueOnce(false);

    expect(() => {
      scheduler.add({
        name: faker.string.sample(),
        cron_string: faker.string.sample(), // invalid,
        handler: () => { },
      });
    }).toThrow(new Error('Cron string is invalid'));
  });
});
