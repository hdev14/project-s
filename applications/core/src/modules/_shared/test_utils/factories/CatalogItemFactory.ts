
import { CatalogItemProps } from "@catalog/domain/CatalogItem";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class CatalogItemFactory implements Factory<CatalogItemProps> {
  async createOne(item: CatalogItemProps): Promise<CatalogItemProps> {
    const values = Object.values(
      Object.assign({}, item, { attributes: JSON.stringify(item.attributes) })
    );

    await globalThis.db.query(
      `INSERT INTO catalog_items ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: CatalogItemProps[]): Promise<CatalogItemProps[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
