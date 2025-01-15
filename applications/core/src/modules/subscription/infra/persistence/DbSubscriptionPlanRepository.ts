
import DefaultRepository from "@shared/DefaultRepository";
import Collection from "@shared/utils/Collection";
import DbUtils from "@shared/utils/DbUtils";
import Page from "@shared/utils/Page";
import { SubscriptionPlanRepository, SubscriptionPlansFilter } from "@subscription/app/SubscriptionPlanRepository";
import { ItemProps } from "@subscription/domain/Item";
import SubscriptionPlan, { SubscriptionPlanProps } from "@subscription/domain/SubscriptionPlan";
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class DbSubscriptionPlanRepository extends DefaultRepository implements SubscriptionPlanRepository {
  readonly #columns = [
    'sp.id',
    'sp.amount',
    'sp.recurrence_type',
    'sp.term_url',
    'sp.tenant_id',
    'sp.next_billing_date',
    'sp.created_at',
    'sp.updated_at',
    'ci.id as item_id',
    'ci.name as item_name',
    'ci.created_at as item_created_at',
    'ci.updated_at as item_updated_at',
  ];

  readonly #select_subscription_plans = `SELECT ${this.#columns.toString()} FROM subscription_plans sp LEFT JOIN subscription_plan_items spi ON spi.subscription_plan_id = sp.id LEFT JOIN catalog_items ci ON spi.item_id = ci.id`;

  async updateSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void> {
    const { id, amount, recurrence_type, tenant_id, term_url, next_billing_date, updated_at } = subscription_plan.toObject();
    const data = { id, amount, recurrence_type, tenant_id, term_url, next_billing_date, updated_at };
    const values = Object.values(data);

    await this.db.query(`UPDATE subscription_plans SET ${DbUtils.setColumns(data)} WHERE id=$1`, DbUtils.sanitizeValues(values));
  }

  async getSubscriptionPlansByIds(ids: string[]): Promise<Collection<SubscriptionPlanProps>> {
    const { rows } = await this.db.query(
      `${this.#select_subscription_plans} WHERE id ${DbUtils.inOperator(ids)}`,
      DbUtils.sanitizeValues(ids),
    );

    return new Collection(Object.values(this.mapSubscriptionPlans(rows)));
  }


  async getSubscriptionPlans(filter: SubscriptionPlansFilter): Promise<Page<SubscriptionPlanProps>> {
    const { rows = [], page_result } = await this.selectSubscriptionPlans(filter);

    const subscription_plans: Record<string, SubscriptionPlan> = this.mapSubscriptionPlans(rows);

    return new Page(Object.values(subscription_plans), page_result);
  }

  private mapSubscriptionPlans(rows: any[]) {
    const subscription_plans: Record<string, SubscriptionPlan> = {};

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const subscription_plan = subscription_plans[row.id];

      if (subscription_plan && row.item_id) {
        subscription_plan.items = subscription_plan.items.concat([{
          id: row.item_id,
          name: row.item_name,
          created_at: row.item_created_at,
          updated_at: row.item_updated_at,
        }]);
        continue;
      }

      const items = row.item_id ? [{
        id: row.item_id,
        name: row.item_name,
        created_at: row.item_created_at,
        updated_at: row.item_updated_at,
      }] : [];

      subscription_plans[row.id] = SubscriptionPlan.fromObject({
        id: row.id,
        amount: parseFloat(row.amount),
        recurrence_type: row.recurrence_type,
        tenant_id: row.tenant_id,
        term_url: row.term_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
        items,
        next_billing_date: row.next_billing_date,
      });
    }
    return subscription_plans;
  }

  private async selectSubscriptionPlans(filter: SubscriptionPlansFilter) {
    const query = `${this.#select_subscription_plans} WHERE sp.tenant_id=$1`;
    const values: unknown[] = [filter.tenant_id];

    if (filter.page_options) {
      return await this.getRowsPaginated({
        main_query: query,
        count_query: 'SELECT COUNT(id) as total FROM subscription_plans WHERE tenant_id=$1',
        page_options: filter.page_options,
        values,
      });
    }

    const { rows } = await this.db.query(query, DbUtils.sanitizeValues(values));

    return { rows, page_result: undefined };
  }

  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null> {
    const { rows: subscription_plan_rows = [] } = await this.db.query(
      'SELECT * FROM subscription_plans WHERE id=$1',
      [id]
    );

    if (subscription_plan_rows.length === 0) {
      return null;
    }

    const subscription_plan_row = subscription_plan_rows[0];

    const { rows: item_rows = [] } = await this.db.query(
      'SELECT ci.id,ci.name,ci.created_at,ci.updated_at FROM subscription_plan_items JOIN catalog_items ci ON item_id = ci.id WHERE subscription_plan_id = $1',
      [id],
    );

    const items: ItemProps[] = [];

    for (let idx = 0; idx < item_rows.length; idx++) {
      const item_row = item_rows[idx];
      items.push({
        id: item_row.id,
        name: item_row.name,
        created_at: item_row.created_at,
        updated_at: item_row.updated_at,
      });
    }

    return SubscriptionPlan.fromObject({
      id: subscription_plan_row.id,
      amount: parseFloat(subscription_plan_row.amount),
      recurrence_type: subscription_plan_row.recurrence_type,
      tenant_id: subscription_plan_row.tenant_id,
      term_url: subscription_plan_row.term_url,
      created_at: subscription_plan_row.created_at,
      updated_at: subscription_plan_row.updated_at,
      items,
      next_billing_date: subscription_plan_row.next_billing_date
    });
  }

  async createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void> {
    const { id, amount, tenant_id, recurrence_type, term_url, items, next_billing_date, created_at, updated_at } = subscription_plan.toObject();

    const data = { id, amount, tenant_id, recurrence_type, term_url, next_billing_date, created_at, updated_at };
    const values = Object.values(data);

    await this.db.query(
      `INSERT INTO subscription_plans ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    const { ids, string_values } = DbUtils.manyToManyValues(items)

    await this.db.query(
      `INSERT INTO subscription_plan_items (subscription_plan_id, item_id) VALUES ${string_values}`,
      [id].concat(ids),
    );
  }
}
