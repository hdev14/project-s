import { AccessPlanProps } from "@auth/domain/AccessPlan";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class AccessPlanFactory implements Factory<AccessPlanProps> {
  async createOne(item: AccessPlanProps): Promise<AccessPlanProps> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO access_plans ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: AccessPlanProps[]): Promise<AccessPlanProps[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
