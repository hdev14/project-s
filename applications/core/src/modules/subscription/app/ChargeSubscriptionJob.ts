import { Cron } from "@shared/decorators";
import { CronJob } from "@shared/Scheduler";

const AT_EVERY_DAY = '0 0 */1 * *';

// TODO: add logic to charge each subscription
export default class ChargeSubscriptionJob implements CronJob {
  @Cron(AT_EVERY_DAY)
  execute() {
    // TODO: get the active subscriptions with next_billing_date equals to current date (paginated)
    throw new Error("Method not implemented.");
  }
}
