
import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { SubscriptionPlanRepository, SubscriptionPlansFilter } from "@subscription/app/SubscriptionPlanRepository";
import { ItemObject } from "@subscription/domain/Item";
import SubscriptionPlan, { SubscriptionPlanObject } from "@subscription/domain/SubscriptionPlan";
import { Pool } from "pg";

export default class DbSubscriptionPlanRepository implements SubscriptionPlanRepository {
  #db: Pool;
  #columns = [
    'sp.id',
    'sp.amount',
    'sp.recurrence_type',
    'sp.term_url',
    'sp.tenant_id',
    'ci.id as item_id',
    'ci.name as item_name'
  ];
  #select_subscription_plans = `SELECT ${this.#columns.toString()} FROM subscription_plans sp LEFT JOIN subscription_plan_items spi ON spi.subscription_plan_id = sp.id LEFT JOIN catalog_items ci ON spi.item_id = ci.id`;

  constructor() {
    this.#db = Database.connect();
  }

  async getSubscriptionPlans(filter: SubscriptionPlansFilter): Promise<PaginatedResult<SubscriptionPlanObject>> {
    const { rows = [], page_result } = await this.selectSubscriptionPlans(filter);

    const subscription_plan_objs: Record<string, SubscriptionPlanObject> = {};

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const subscription_plan_obj = subscription_plan_objs[row.id];

      if (subscription_plan_obj && row.item_id) {
        subscription_plan_obj.items.push({
          id: row.item_id,
          name: row.item_name,
        });
        continue;
      }

      const items = row.item_id ? [{
        id: row.item_id,
        name: row.item_name
      }] : [];

      subscription_plan_objs[row.id] = {
        id: row.id,
        amount: row.amount,
        recurrence_type: row.recurrence_type,
        tenant_id: row.tenant_id,
        term_url: row.term_url,
        items,
      };
    }

    return { results: Object.values(subscription_plan_objs), page_result };
  }

  private async selectSubscriptionPlans(filter: SubscriptionPlansFilter) {
    const query = this.#select_subscription_plans + ' WHERE sp.tenant_id=$1';
    const values: unknown[] = [filter.tenant_id];

    if (filter.page_options) {
      const count_query = 'SELECT COUNT(id) as total FROM subscription_plans WHERE tenant_id=$1';
      const offset = Pagination.calculateOffset(filter.page_options);

      const count_result = await this.#db.query(count_query, DbUtils.sanitizeValues(values));

      const paginated_query = query + ' LIMIT $2 OFFSET $3';

      const { rows } = await this.#db.query(
        paginated_query,
        DbUtils.sanitizeValues(values.concat([filter.page_options.limit, offset]))
      );

      const page_result = (count_result.rows[0].total !== undefined && count_result.rows[0].total > 0)
        ? Pagination.calculatePageResult(count_result.rows[0].total, filter!.page_options!)
        : undefined;

      return { rows, page_result };
    }

    const { rows } = await this.#db.query(query, DbUtils.sanitizeValues(values));

    return { rows };

  }

  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null> {
    const { rows: subscription_plan_rows = [] } = await this.#db.query(
      'SELECT * FROM subscription_plans WHERE id=$1',
      [id]
    );

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

  async createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void> {
    const { id, amount, tenant_id, recurrence_type, term_url, items } = subscription_plan.toObject();

    const data = { id, amount, tenant_id, recurrence_type, term_url };
    const values = Object.values(data);

    await this.#db.query(
      `INSERT INTO subscription_plans ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    const item_ids = [];
    let subscription_items = '';

    for (let idx = 0; idx < items.length; idx++) {
      item_ids.push(items[idx].id!);

      if (idx !== items.length - 1) {
        subscription_items += `($1,$${idx + 2}), `;
        continue;
      }

      subscription_items += `($1,$${idx + 2})`;
    }

    await this.#db.query(
      `INSERT INTO subscription_plan_items (subscription_plan_id, item_id) VALUES ${subscription_items}`,
      [id].concat(item_ids),
    );
  }
}
