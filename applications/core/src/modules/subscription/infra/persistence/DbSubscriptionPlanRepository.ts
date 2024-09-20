
import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { SubscriptionPlanRepository, SubscriptionPlansFilter } from "@subscription/app/SubscriptionPlanRepository";
import { ItemProps } from "@subscription/domain/Item";
import SubscriptionPlan, { SubscriptionPlanProps } from "@subscription/domain/SubscriptionPlan";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';

@injectable()
export default class DbSubscriptionPlanRepository implements SubscriptionPlanRepository {
  #db: Pool;
  #columns = [
    'sp.id',
    'sp.amount',
    'sp.recurrence_type',
    'sp.term_url',
    'sp.tenant_id',
    'sp.created_at',
    'sp.updated_at',
    'ci.id as item_id',
    'ci.name as item_name',
    'ci.created_at as item_created_at',
    'ci.updated_at as item_updated_at',
  ];
  #select_subscription_plans = `SELECT ${this.#columns.toString()} FROM subscription_plans sp LEFT JOIN subscription_plan_items spi ON spi.subscription_plan_id = sp.id LEFT JOIN catalog_items ci ON spi.item_id = ci.id`;

  constructor() {
    this.#db = Database.connect();
  }

  async getSubscriptionPlans(filter: SubscriptionPlansFilter): Promise<PaginatedResult<SubscriptionPlanProps>> {
    const { rows = [], page_result } = await this.selectSubscriptionPlans(filter);

    const subscription_plan_objs: Record<string, SubscriptionPlanProps> = {};

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const subscription_plan_obj = subscription_plan_objs[row.id];

      if (subscription_plan_obj && row.item_id) {
        subscription_plan_obj.items.push({
          id: row.item_id,
          name: row.item_name,
          created_at: row.item_created_at,
          updated_at: row.item_updated_at,
        });
        continue;
      }

      const items = row.item_id ? [{
        id: row.item_id,
        name: row.item_name,
        created_at: row.item_created_at,
        updated_at: row.item_updated_at,
      }] : [];

      subscription_plan_objs[row.id] = {
        id: row.id,
        amount: row.amount,
        recurrence_type: row.recurrence_type,
        tenant_id: row.tenant_id,
        term_url: row.term_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
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

    return new SubscriptionPlan({
      id: subscription_plan_row.id,
      amount: subscription_plan_row.amount,
      recurrence_type: subscription_plan_row.recurrence_type,
      tenant_id: subscription_plan_row.tenant_id,
      term_url: subscription_plan_row.term_url,
      created_at: subscription_plan_row.created_at,
      updated_at: subscription_plan_row.updated_at,
      items,
    });
  }

  async createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void> {
    const { id, amount, tenant_id, recurrence_type, term_url, items, created_at, updated_at } = subscription_plan.toObject();

    const data = { id, amount, tenant_id, recurrence_type, term_url, created_at, updated_at };
    const values = Object.values(data);

    await this.#db.query(
      `INSERT INTO subscription_plans ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    const { ids, string_values } = DbUtils.manyToManyValues(items)

    await this.#db.query(
      `INSERT INTO subscription_plan_items (subscription_plan_id, item_id) VALUES ${string_values}`,
      [id].concat(ids),
    );
  }
}
