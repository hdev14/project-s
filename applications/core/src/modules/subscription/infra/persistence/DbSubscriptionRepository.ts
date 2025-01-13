import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";
import { PaginatedResult } from "@shared/utils/Pagination";
import SubscriptionRepository, { SubscriptionsFilter } from "@subscription/app/SubscriptionRepository";
import Subscription, { SubscriptionProps } from "@subscription/domain/Subscription";
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class DbSubscriptionRepository extends DefaultRepository implements SubscriptionRepository {
  async createSubscription(subscription: Subscription): Promise<void> {
    const subscription_obj = subscription.toObject();
    const values = Object.values(subscription_obj);
    await this.db.query(
      `INSERT INTO subscriptions ${DbUtils.columns(subscription_obj)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values)
    );
  }

  async updateSubscription(subscription: Subscription): Promise<void> {
    const subscription_obj = Object.assign({}, subscription.toObject(), { created_at: undefined });

    await this.db.query(
      `UPDATE subscriptions SET ${DbUtils.setColumns(subscription_obj)} WHERE id = $1`,
      DbUtils.sanitizeValues(Object.values(subscription_obj))
    );
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const result = await this.db.query('SELECT * FROM subscriptions WHERE id=$1', [id]);

    return result.rows.length === 0 ? null : Subscription.fromObject({
      id: result.rows[0].id,
      status: result.rows[0].status,
      subscription_plan_id: result.rows[0].subscription_plan_id,
      subscriber_id: result.rows[0].subscriber_id,
      started_at: result.rows[0].started_at,
      tenant_id: result.rows[0].tenant_id,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
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
        started_at: subscription.started_at,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
      });
    }

    return { results, page_result };
  }

  private async selectSubscriptions(filter: SubscriptionsFilter) {
    const where_clause = `WHERE ${DbUtils.andOperator({ tenant_id: filter.tenant_id, status: filter.status })}`;
    const query = `SELECT * FROM subscriptions ${where_clause}`;

    const values: unknown[] = [filter.tenant_id, filter.status];

    if (filter.page_options) {
      return this.getRowsPaginated({
        main_query: query,
        count_query: `SELECT count(id) as total FROM subscriptions ${where_clause}`,
        page_options: filter.page_options,
        values,
      });
    }

    const { rows } = await this.db.query(query, DbUtils.sanitizeValues(values));

    return { rows, page_result: undefined };
  }
}
