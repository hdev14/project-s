import PaymentLog, { PaymentLogProps } from "@payment/domain/PaymentLog";

export default interface PaymentLogRepository {
  createPaymentLog(payment_log: PaymentLog): Promise<void>;
  getPaymentLogsByPaymentId(payment_id: string): Promise<PaymentLogProps[]>;
}
