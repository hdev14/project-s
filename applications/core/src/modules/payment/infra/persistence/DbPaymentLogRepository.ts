import PaymentLogRepository from "@payment/app/PaymentLogRepository";
import PaymentLog, { PaymentLogObject } from "@payment/domain/PaymentLog";

export default class DbPaymentLogRepository implements PaymentLogRepository {
  createPaymentLog(payment_log: PaymentLog): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPaymentLogsByPaymentId(payment_id: string): Promise<PaymentLogObject[]> {
    throw new Error("Method not implemented.");
  }
}
