import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import { PaginatedResult } from "@shared/utils/Pagination";
import SubscriptionRepository, { SubscriptionsFilter } from "@subscription/app/SubscriptionRepository";
import Subscription, { SubscriptionObject } from "@subscription/domain/Subscription";
import { Pool } from "pg";

export default class DbSubscriptionRepository implements SubscriptionRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async createSubscription(subscription: Subscription): Promise<void> {
    const subscription_obj = subscription.toObject();
    const values = Object.values(subscription_obj);
    await this.#db.query(
      `INSERT INTO subscriptions ${DbUtils.columns(subscription_obj)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values)
    );
  }

  async updateSubscription(subscription: Subscription): Promise<void> {
    const subscription_obj = subscription.toObject();

    await this.#db.query(
      `UPDATE subscriptions SET ${DbUtils.setColumns(subscription_obj)} WHERE id = $1`,
      DbUtils.sanitizeValues(Object.values(subscription_obj))
    );
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const result = await this.#db.query('SELECT * FROM subscriptions WHERE id=$1', [id]);

    return result.rows.length === 0 ? null : new Subscription({
      id: result.rows[0].id,
      status: result.rows[0].status,
      subscription_plan_id: result.rows[0].subscription_plan_id,
      subscriber_id: result.rows[0].subscriber_id,
      started_at: result.rows[0].started_at,
      tenant_id: result.rows[0].tenant_id,
    });
  }

  getSubscriptions(filter: SubscriptionsFilter): Promise<PaginatedResult<SubscriptionObject>> {
    throw new Error("Method not implemented.");
  }
}
