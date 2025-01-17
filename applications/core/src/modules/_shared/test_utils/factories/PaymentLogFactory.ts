import { PaymentLogProps } from "@payment/domain/PaymentLog";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class PaymentLogFactory implements Factory<PaymentLogProps> {
  async createOne(item: PaymentLogProps): Promise<PaymentLogProps> {
    const values = Object.values(item);

    await globalThis.db.query(
      `INSERT INTO payment_logs ${DbUtils.columns(item)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: PaymentLogProps[]): Promise<PaymentLogProps[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
