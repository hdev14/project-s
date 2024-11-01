import CatalogRepository, { CatalogItemsFilter } from "@catalog/app/CatalogRepository";
import CatalogItem, { CatalogItemProps } from "@catalog/domain/CatalogItem";
import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';

@injectable()
export default class DbCatalogRepository implements CatalogRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getCatalogItemById(id: string): Promise<CatalogItem | null> {
    const result = await this.#db.query('SELECT * FROM catalog_items WHERE id=$1', [id]);

    return result.rows.length === 0 ? null : CatalogItem.fromObject({
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      amount: parseFloat(result.rows[0].amount),
      attributes: result.rows[0].attributes,
      is_service: result.rows[0].is_service,
      tenant_id: result.rows[0].tenant_id,
      created_at: new Date(result.rows[0].created_at),
      updated_at: new Date(result.rows[0].updated_at),
    });
  }

  async getCatalogItems(filter?: CatalogItemsFilter): Promise<PaginatedResult<CatalogItemProps>> {
    const { rows, page_result } = await this.selectCatalogItems(filter);

    const results = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      results.push({
        id: row.id,
        name: row.name,
        description: row.description,
        amount: parseFloat(row.amount),
        is_service: row.is_service,
        attributes: row.attributes,
        picture_url: row.picture_url,
        tenant_id: row.tenant_id,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      });
    }

    return { results, page_result };
  }

  private async selectCatalogItems(filter?: CatalogItemsFilter) {
    const select_catalog_items = 'SELECT * FROM catalog_items WHERE deleted_at IS NULL';

    if (filter) {
      const count_select_catalog_items = 'SELECT count(id) as total FROM catalog_items WHERE deleted_at IS NULL';
      const count_query = filter.tenant_id ? count_select_catalog_items + ' AND tenant_id=$1' : count_select_catalog_items;
      const query = filter.tenant_id ? select_catalog_items + ' AND tenant_id=$1' : select_catalog_items;
      const values: unknown[] = [filter.tenant_id];

      if (filter.page_options) {
        const offset = Pagination.calculateOffset(filter.page_options);
        const count_result = await this.#db.query(count_query, DbUtils.sanitizeValues(values));

        const paginated_query = filter.tenant_id ? query + ' LIMIT $2 OFFSET $3' : query + ' LIMIT $1 OFFSET $2';

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

    const { rows } = await this.#db.query(select_catalog_items);
    return { rows };
  }

  async createCatalogItem(catalog_item: CatalogItem): Promise<void> {
    const catalog_item_obj = catalog_item.toObject();
    const data = Object.assign(catalog_item_obj, { attributes: JSON.stringify(catalog_item_obj.attributes) })
    const values = Object.values(data);

    await this.#db.query(
      `INSERT INTO catalog_items ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );
  }

  async updateCatalogItem(catalog_item: CatalogItem): Promise<void> {
    const catalog_item_obj = catalog_item.toObject();
    const data = Object.assign({}, catalog_item_obj, { attributes: JSON.stringify(catalog_item_obj.attributes), created_at: undefined });
    const query = `UPDATE catalog_items SET ${DbUtils.setColumns(data)} WHERE id=$1`;
    const values = DbUtils.sanitizeValues(Object.values(data));

    await this.#db.query(query, values);
  }

  async deleteCatalogItem(id: string): Promise<void> {
    const data = {
      id,
      deleted_at: Date.now(),
    };

    await this.#db.query(
      `UPDATE catalog_items SET ${DbUtils.setColumns(data)} WHERE id=$1`,
      DbUtils.sanitizeValues(Object.values(Object.values(data)))
    );
  }
}
