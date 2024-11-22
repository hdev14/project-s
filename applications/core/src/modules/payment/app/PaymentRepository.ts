import Payment, { PaymentProps } from "@payment/domain/Payment";

export type PaymentsFilter = {
  subscription_id: string;
};

export default interface PaymentRepository {
  createPayment(payment: Payment): Promise<void>;
  updatePayment(payment: Payment): Promise<void>;
  getPaymentById(id: string): Promise<Payment | null>;
  getPayments(filter: PaymentsFilter): Promise<PaymentProps[]>;
}
