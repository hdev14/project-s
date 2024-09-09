import { UserObject } from "@auth/domain/User";
import { CompanyObject } from "@company/domain/Company";
import DbUtils from "@shared/utils/DbUtils";
import { SubscriberObject } from "@subscriber/domain/Subscriber";
import Factory from "./Factory";

export type UserData = Omit<UserObject, 'policies'> & Partial<CompanyObject> & Partial<SubscriberObject>;

export default class UserFactory implements Factory<UserData> {
  async createOne(item: UserData): Promise<UserData> {
    const { address, payment_method, ...rest } = item;

    const data = Object.assign({}, rest, address || {}, payment_method || {});
    const values = Object.values(data);

    await globalThis.db.query(
      `INSERT INTO users ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
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
