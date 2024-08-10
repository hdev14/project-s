
import { CommissionObject } from "@company/domain/Commission";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class CommissionFactory implements Factory<CommissionObject> {
  async createOne(item: CommissionObject): Promise<CommissionObject> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO commissions ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: CommissionObject[]): Promise<CommissionObject[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
