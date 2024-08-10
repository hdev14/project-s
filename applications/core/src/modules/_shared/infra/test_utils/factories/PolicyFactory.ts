import { PolicyObject } from "@auth/domain/Policy";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class PolicyFactory implements Factory<PolicyObject> {
  async createOne(item: PolicyObject): Promise<PolicyObject> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO policies ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: PolicyObject[]): Promise<PolicyObject[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
