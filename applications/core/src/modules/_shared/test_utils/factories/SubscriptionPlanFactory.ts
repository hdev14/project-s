import DbUtils from "@shared/utils/DbUtils";
import { SubscriptionPlanObject } from "@subscription/domain/SubscriptionPlan";
import Factory from "./Factory";

export default class SubscriptionPlanFactory implements Factory<SubscriptionPlanObject> {
  async createOne(item: SubscriptionPlanObject): Promise<SubscriptionPlanObject> {
    const { amount, items, recurrence_type, tenant_id, id, term_url } = item;
    const data = {
      id,
      amount,
      recurrence_type,
      tenant_id,
      term_url,
    };
    const values = Object.values(data);

    await globalThis.db.query(
      `INSERT INTO subscription_plans ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    const { ids, string_values } = DbUtils.manyToManyValues(items)

    await globalThis.db.query(
      `INSERT INTO subscription_plan_items (subscription_plan_id, item_id) VALUES ${string_values}`,
      [id].concat(ids),
    );

    return item;
  }

  async createMany(items: SubscriptionPlanObject[]): Promise<SubscriptionPlanObject[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
