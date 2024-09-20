import { VerificationCodeProps } from "@auth/domain/VerificationCode";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class VerificationCodeFactory implements Factory<VerificationCodeProps> {
  async createOne(item: VerificationCodeProps): Promise<VerificationCodeProps> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO verification_codes ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: VerificationCodeProps[]): Promise<VerificationCodeProps[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
