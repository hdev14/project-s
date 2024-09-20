import DbUtils from "@shared/utils/DbUtils";
import { SubscriptionProps } from "@subscription/domain/Subscription";
import Factory from "./Factory";

export default class SubscriptionFactory implements Factory<SubscriptionProps> {
  async createOne(item: SubscriptionProps): Promise<SubscriptionProps> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO subscriptions ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: SubscriptionProps[]): Promise<SubscriptionProps[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
