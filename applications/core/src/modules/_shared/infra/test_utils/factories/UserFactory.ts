import { UserObject } from "@auth/domain/User";
import { CompanyObject } from "@company/domain/Company";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export type UserData = Omit<UserObject, 'policies'> & Partial<CompanyObject>;

export default class UserFactory implements Factory<UserData> {
  async createOne(item: UserData): Promise<UserData> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO users ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: UserData[]): Promise<UserData[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
