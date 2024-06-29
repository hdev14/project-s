import CatalogRepository from "@catalog/app/CatalogRepository";
import CatalogItem from "@catalog/domain/CatalogItem";
import Database from "@shared/infra/Database";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PageOptions, PaginatedResult } from "@shared/utils/Pagination";
import { Pool } from "pg";

export default class DbCatalogRepository implements CatalogRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getCatalogItems(page_options?: PageOptions): Promise<PaginatedResult<CatalogItem>> {
    const { result, total } = await this.selectCatalogItems(page_options);

    const page_result = (total !== undefined && total > 0)
      ? Pagination.calculatePageResult(total, page_options!)
      : undefined;

    const results = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      const row = result.rows[idx];
      results.push(new CatalogItem({
        id: row.id,
        name: row.name,
        description: row.description,
        is_service: row.is_service,
        attributes: JSON.parse(row.attributes),
        picture_url: row.picture_url,
      }));
    }

    return { results, page_result };
  }

  private async selectCatalogItems(page_options?: PageOptions) {
    if (page_options) {
      const offset = Pagination.calculateOffset(page_options);
      const total_result = await this.#db.query('SELECT count(id) as total FROM catalog_items WHERE deleted_at IS NULL');

      const result = await this.#db.query(
        'SELECT * FROM catalog_items WHERE deleted_at IS NULL LIMIT $1 OFFSET $2',
        [page_options.limit, offset]
      );

      return { result, total: total_result.rows[0].total };
    }

    return { result: await this.#db.query('SELECT * FROM catalog_items WHERE deleted_at IS NULL') };
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
    const data = Object.assign(catalog_item_obj, { attributes: JSON.stringify(catalog_item_obj.attributes) });
    const query = `UPDATE catalog_items SET ${DbUtils.setColumns(data)} WHERE id=$1`;
    const values = DbUtils.sanitizeValues(Object.values(data));

    await this.#db.query(query, values);
  }

  deleteCatalogItem(id: string): Promise<void> {
    throw new Error();
  }
}