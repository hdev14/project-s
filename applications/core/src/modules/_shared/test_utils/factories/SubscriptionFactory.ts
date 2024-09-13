import DbUtils from "@shared/utils/DbUtils";
import { SubscriptionObject } from "@subscription/domain/Subscription";
import Factory from "./Factory";

export default class SubscriptionFactory implements Factory<SubscriptionObject> {
  async createOne(item: SubscriptionObject): Promise<SubscriptionObject> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO subscriptions ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: SubscriptionObject[]): Promise<SubscriptionObject[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
