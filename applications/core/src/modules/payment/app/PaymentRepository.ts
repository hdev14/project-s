import Payment from "@payment/domain/Payment";
import PaymentLog from "@payment/domain/PaymentLog";

export default interface PaymentRepository {
  createPayment(payment: Payment): Promise<void>;
  updatePayment(payment: Payment): Promise<void>;
  getPaymentById(id: string): Promise<Payment | null>;
  createPaymentLog(payment_log: PaymentLog): Promise<void>;
}