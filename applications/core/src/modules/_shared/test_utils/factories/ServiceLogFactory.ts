
import { ServiceLogProps } from "@company/domain/ServiceLog";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class ServiceLogFactory implements Factory<ServiceLogProps> {
  async createOne(item: ServiceLogProps): Promise<ServiceLogProps> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO service_logs ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: ServiceLogProps[]): Promise<ServiceLogProps[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
