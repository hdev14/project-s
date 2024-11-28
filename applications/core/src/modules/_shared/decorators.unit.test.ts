import cron from 'node-cron';
import { Cron } from "./decorators";

jest.mock('node-cron');
const cron_mocked = jest.mocked(cron);

describe('Decorators unit tests', () => {
  describe('Cron', () => {
    it('should throw an error if cron_string is invalid', () => {

      cron_mocked.validate.mockReturnValueOnce(false);

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class Test {
          @Cron('60 * * * *')
          test() { }
        }
      }).toThrow(new Error('Cron string is invalid'));
    });
  });
});
