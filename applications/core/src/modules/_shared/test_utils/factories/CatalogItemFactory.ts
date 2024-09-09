
import { CatalogItemObject } from "@catalog/domain/CatalogItem";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class CatalogItemFactory implements Factory<CatalogItemObject> {
  async createOne(item: CatalogItemObject): Promise<CatalogItemObject> {
    const values = Object.values(
      Object.assign({}, item, { attributes: JSON.stringify(item.attributes) })
    );

    await globalThis.db.query(
      `INSERT INTO catalog_items ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: CatalogItemObject[]): Promise<CatalogItemObject[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
