
import { ServiceLogObject } from "@company/domain/ServiceLog";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class ServiceLogFactory implements Factory<ServiceLogObject> {
  async createOne(item: ServiceLogObject): Promise<ServiceLogObject> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO service_logs ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: ServiceLogObject[]): Promise<ServiceLogObject[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
