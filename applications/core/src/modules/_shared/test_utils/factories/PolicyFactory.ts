import { PolicyProps } from "@auth/domain/Policy";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class PolicyFactory implements Factory<PolicyProps> {
  async createOne(item: PolicyProps): Promise<PolicyProps> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO policies ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: PolicyProps[]): Promise<PolicyProps[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
