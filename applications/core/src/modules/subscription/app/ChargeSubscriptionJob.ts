import { Cron } from "@shared/decorators";
import { CronJob } from "@shared/Scheduler";

const AT_EVERY_DAY = '0 0 */1 * *';

// TODO: add logic to charge each subscription
export default class ChargeSubscriptionJob implements CronJob {
  @Cron(AT_EVERY_DAY)
  execute() {
    throw new Error("Method not implemented.");
  }
}
