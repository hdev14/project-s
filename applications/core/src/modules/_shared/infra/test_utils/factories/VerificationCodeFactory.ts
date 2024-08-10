import { VerificationCodeObject } from "@auth/domain/VerificationCode";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class VerificationCodeFactory implements Factory<VerificationCodeObject> {
  async createOne(item: VerificationCodeObject): Promise<VerificationCodeObject> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO verification_codes ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: VerificationCodeObject[]): Promise<VerificationCodeObject[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
