import CatalogRepository, { CatalogItemsFilter } from "@catalog/app/CatalogRepository";
import CatalogItem, { CatalogItemProps } from "@catalog/domain/CatalogItem";
import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";
import Page from "@shared/utils/Page";
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class DbCatalogRepository extends DefaultRepository implements CatalogRepository {
  async getCatalogItemById(id: string): Promise<CatalogItem | null> {
    const result = await this.db.query('SELECT * FROM catalog_items WHERE id=$1', [id]);

    return result.rows.length === 0 ? null : CatalogItem.fromObject({
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      amount: parseFloat(result.rows[0].amount),
      attributes: result.rows[0].attributes,
      is_service: result.rows[0].is_service,
      tenant_id: result.rows[0].tenant_id,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
    });
  }

  async getCatalogItems(filter?: CatalogItemsFilter): Promise<Page<CatalogItemProps>> {
    const { rows, page_info } = await this.selectCatalogItems(filter);

    const result = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      result.push(CatalogItem.fromObject({
        id: row.id,
        name: row.name,
        description: row.description,
        amount: parseFloat(row.amount),
        is_service: row.is_service,
        attributes: row.attributes,
        picture_url: row.picture_url,
        tenant_id: row.tenant_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    }

    return new Page(result, page_info);
  }

  private async selectCatalogItems(filter?: CatalogItemsFilter) {
    const select_catalog_items = 'SELECT * FROM catalog_items WHERE deleted_at IS NULL';

    if (filter) {
      const count_select_catalog_items = 'SELECT count(id) as total FROM catalog_items WHERE deleted_at IS NULL';
      const count_query = filter.tenant_id ? count_select_catalog_items + ' AND tenant_id=$1' : count_select_catalog_items;
      const query = filter.tenant_id ? select_catalog_items + ' AND tenant_id=$1' : select_catalog_items;
      const values: unknown[] = [filter.tenant_id];

      if (filter.page_options) {
        return this.getRowsPaginated({
          main_query: query,
          count_query,
          page_options: filter.page_options,
          values,
        });
      }

      const { rows } = await this.db.query(query, DbUtils.sanitizeValues(values));
      return { rows, page_info: undefined };
    }

    const { rows } = await this.db.query(select_catalog_items);
    return { rows, page_info: undefined };
  }

  async createCatalogItem(catalog_item: CatalogItem): Promise<void> {
    const catalog_item_obj = catalog_item.toObject();
    const data = Object.assign(catalog_item_obj, { attributes: JSON.stringify(catalog_item_obj.attributes) })
    const values = Object.values(data);

    await this.db.query(
      `INSERT INTO catalog_items ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );
  }

  async updateCatalogItem(catalog_item: CatalogItem): Promise<void> {
    const catalog_item_obj = catalog_item.toObject();
    const data = Object.assign({}, catalog_item_obj, { attributes: JSON.stringify(catalog_item_obj.attributes), created_at: undefined });
    const query = `UPDATE catalog_items SET ${DbUtils.setColumns(data)} WHERE id=$1`;
    const values = DbUtils.sanitizeValues(Object.values(data));

    await this.db.query(query, values);
  }

  async deleteCatalogItem(id: string): Promise<void> {
    const data = {
      id,
      deleted_at: Date.now(),
    };

    await this.db.query(
      `UPDATE catalog_items SET ${DbUtils.setColumns(data)} WHERE id=$1`,
      DbUtils.sanitizeValues(Object.values(Object.values(data)))
    );
  }
}
