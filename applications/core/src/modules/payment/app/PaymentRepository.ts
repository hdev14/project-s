import Payment from "@payment/domain/Payment";

export default interface PaymentRepository {
  createPayment(payment: Payment): Promise<void>;
  updatePayment(payment: Payment): Promise<void>;
  getPaymentById(id: string): Promise<Payment | null>;
}
