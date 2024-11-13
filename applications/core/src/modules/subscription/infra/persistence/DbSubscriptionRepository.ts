import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import SubscriptionRepository, { SubscriptionsFilter } from "@subscription/app/SubscriptionRepository";
import Subscription, { SubscriptionProps } from "@subscription/domain/Subscription";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';

@injectable()
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
    const subscription_obj = Object.assign({}, subscription.toObject(), { created_at: undefined });

    await this.#db.query(
      `UPDATE subscriptions SET ${DbUtils.setColumns(subscription_obj)} WHERE id = $1`,
      DbUtils.sanitizeValues(Object.values(subscription_obj))
    );
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const result = await this.#db.query('SELECT * FROM subscriptions WHERE id=$1', [id]);

    return result.rows.length === 0 ? null : Subscription.fromObject({
      id: result.rows[0].id,
      status: result.rows[0].status,
      subscription_plan_id: result.rows[0].subscription_plan_id,
      subscriber_id: result.rows[0].subscriber_id,
      started_at: result.rows[0].started_at ? new Date(result.rows[0].started_at) : undefined,
      billing_day: parseInt(result.rows[0].billing_day, 10),
      tenant_id: result.rows[0].tenant_id,
      created_at: new Date(result.rows[0].created_at),
      updated_at: new Date(result.rows[0].updated_at),
    });
  }

  async getSubscriptions(filter: SubscriptionsFilter): Promise<PaginatedResult<SubscriptionProps>> {
    const { rows, page_result } = await this.selectSubscriptions(filter);

    const results: SubscriptionProps[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const subscription = rows[idx];
      results.push({
        id: subscription.id,
        status: subscription.status,
        subscriber_id: subscription.subscriber_id,
        subscription_plan_id: subscription.subscription_plan_id,
        tenant_id: subscription.tenant_id,
        started_at: subscription.started_at ? new Date(subscription.started_at) : undefined,
        billing_day: parseInt(subscription.billing_day, 10),
        created_at: new Date(subscription.created_at),
        updated_at: new Date(subscription.updated_at),
      });
    }

    return { results, page_result };
  }

  private async selectSubscriptions(filter: SubscriptionsFilter) {
    const query = 'SELECT * FROM subscriptions WHERE tenant_id=$1';
    const values: any[] = [filter.tenant_id];

    if (filter.page_options) {
      const offset = Pagination.calculateOffset(filter.page_options);
      const count_result = await this.#db.query('SELECT count(id) as total FROM subscriptions WHERE tenant_id=$1', values);

      const paginated_query = `${query} LIMIT $2 OFFSET $3`;

      const result = await this.#db.query(paginated_query, values.concat([filter.page_options.limit, offset]));

      const page_result = (count_result.rows[0].total !== undefined && count_result.rows[0].total > 0)
        ? Pagination.calculatePageResult(count_result.rows[0].total, filter!.page_options!)
        : undefined;

      return { rows: result.rows, page_result };
    }

    const { rows } = await this.#db.query(query, values);

    return { rows };
  }

}
