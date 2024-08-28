import PaymentRepository from "@payment/app/PaymentRepository";
import Payment from "@payment/domain/Payment";
import PaymentLog from "@payment/domain/PaymentLog";

export default class DbPaymentRepository implements PaymentRepository {
  createPayment(payment: Payment): Promise<void> {
    throw new Error("Method not implemented.");
  }

  updatePayment(payment: Payment): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getPaymentById(id: string): Promise<Payment | null> {
    throw new Error("Method not implemented.");
  }

  createPaymentLog(payment_log: PaymentLog): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
