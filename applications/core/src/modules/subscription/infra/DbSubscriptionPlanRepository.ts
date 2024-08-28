
import Database from "@shared/infra/Database";
import { PaginatedResult } from "@shared/utils/Pagination";
import { SubscriptionPlanRepository } from "@subscription/app/SubscriptionPlanRepository";
import { ItemObject } from "@subscription/domain/Item";
import SubscriptionPlan from "@subscription/domain/SubscriptionPlan";
import { Pool } from "pg";

export default class DbSubscriptionPlanRepository implements SubscriptionPlanRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  getSubscriptionPlans(): Promise<PaginatedResult<SubscriptionPlan>> {
    throw new Error("Method not implemented.");
  }

  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null> {
    const { rows: subscription_plan_rows = [] } = await this.#db.query('SELECT * FROM subscription_plans WHERE id=$1', [id]);

    if (subscription_plan_rows.length === 0) {
      return null;
    }

    const subscription_plan_row = subscription_plan_rows[0];

    const { rows: item_rows = [] } = await this.#db.query(
      'SELECT ci.id, ci.name FROM subscription_plan_items JOIN catalog_items ci ON item_id = ci.id WHERE subscription_plan_id = $1',
      [id],
    );

    const items: ItemObject[] = [];

    for (let idx = 0; idx < item_rows.length; idx++) {
      const item_row = item_rows[idx];
      items.push({
        id: item_row.id,
        name: item_row.name,
      });
    }

    return new SubscriptionPlan({
      id: subscription_plan_row.id,
      amount: subscription_plan_row.amount,
      recurrence_type: subscription_plan_row.recurrence_type,
      tenant_id: subscription_plan_row.tenant_id,
      term_url: subscription_plan_row.term_url,
      items,
    });
  }

  createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
