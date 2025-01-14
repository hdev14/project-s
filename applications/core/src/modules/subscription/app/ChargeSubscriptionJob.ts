import { Cron } from "@shared/decorators";
import Queue, { Message } from "@shared/Queue";
import { CronJob } from "@shared/Scheduler";
import { SubscriptionStatus } from "@subscription/domain/Subscription";
import { SubscriptionPlanProps } from "@subscription/domain/SubscriptionPlan";
import { randomUUID } from "crypto";
import { interfaces } from "inversify";
import { SubscriptionPlanRepository } from "./SubscriptionPlanRepository";
import SubscriptionRepository from "./SubscriptionRepository";

export default class ChargeSubscriptionJob implements CronJob {
  static AT_EVERY_DAY = '0 0 */1 * *';
  subscription_repository!: SubscriptionRepository;
  subscription_plan_repository!: SubscriptionPlanRepository;
  queue_constructor!: interfaces.Newable<Queue>;

  @Cron(ChargeSubscriptionJob.AT_EVERY_DAY)
  async execute(): Promise<void> {
    const current_date = new Date();

    let next_page = 1;

    const payment_queue = new this.queue_constructor({ queue: process.env.PAYMENT_QUEUE, attempts: 3 });

    do {
      const { results, page_result } = await this.subscription_repository.getSubscriptions({
        status: SubscriptionStatus.ACTIVE,
        page_options: {
          limit: 50,
          page: next_page,
        }
      });

      const subscription_plan_ids: string[] = [];

      for (let idx = 0; idx < results.length; idx++) {
        subscription_plan_ids.push(results[idx].subscription_plan_id);
      }

      const subscription_plans = await this.subscription_plan_repository.getSubscriptionPlansByIds(subscription_plan_ids);

      const subscription_plans_map = new Map<string, SubscriptionPlanProps>();

      for (let idx = 0; idx < subscription_plans.length; idx++) {
        const sp = subscription_plans[idx];
        subscription_plans_map.set(sp.id!, sp);
      }

      const messages: Message[] = [];

      for (let idx = 0; idx < results.length; idx++) {
        const subscription = results[idx];

        const subscription_plan = subscription_plans_map.get(subscription.subscription_plan_id);

        const hasSameDate = (
          subscription_plan!.next_billing_date &&
          subscription_plan!.next_billing_date.getDate() === current_date.getDate() &&
          subscription_plan!.next_billing_date.getMonth() === current_date.getMonth() &&
          subscription_plan!.next_billing_date.getFullYear() === current_date.getFullYear()
        );

        if (hasSameDate) {
          messages.push({
            id: randomUUID(),
            name: 'ChargeActiveSubscription',
            payload: {
              subscription_id: subscription.id,
              subscriber_id: subscription.subscriber_id,
              tenant_id: subscription!.tenant_id,
              amount: subscription_plan!.amount,
            }
          });
        }
      }

      await payment_queue.addMessages(messages);

      next_page = page_result!.next_page;
    } while (next_page !== -1);

    await payment_queue.close();
  }
}
