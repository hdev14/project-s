import { PaymentProps } from "@payment/domain/Payment";
import DbUtils from "@shared/utils/DbUtils";
import Factory from "./Factory";

export default class PaymentFactory implements Factory<Omit<PaymentProps, 'customer'>> {
  async createOne(item: Omit<PaymentProps, 'customer'>): Promise<Omit<PaymentProps, 'customer'>> {
    const {
      id,
      amount,
      tax,
      status,
      subscription_id,
      tenant_id,
      refusal_reason
    } = item;
    const data = {
      id,
      amount,
      tax,
      status,
      subscription_id,
      tenant_id,
      refusal_reason
    };
    const values = Object.values(data);

    await globalThis.db.query(
      `INSERT INTO payments ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values),
    );

    return item;
  }

  async createMany(items: Omit<PaymentProps, 'customer'>[]): Promise<Omit<PaymentProps, 'customer'>[]> {
    for (let idx = 0; idx < items.length; idx++) {
      await this.createOne(items[idx]);
    }
    return items;
  }
}
