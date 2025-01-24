import Payment, { PaymentStatus } from "@payment/domain/Payment";
import PaymentLog from "@payment/domain/PaymentLog";

export type Customer = {
  document: string;
  email: string;
};

export type RegisterCustomerResult = Customer & { id: string };

export type RegisterCreditCardResult = {
  credit_card_id: string,
};

export type TransactionResult = {
  status: PaymentStatus;
  reason?: string;
  payload: string;
};

export default interface PaymentGateway {
  getPayment(external_id: string): Promise<TransactionResult | null>;
  makePayment(payment: Payment): Promise<PaymentLog>;
  registerCustomer(customer: Customer): Promise<RegisterCustomerResult>;
  registerCreditCard(external_customer_id: string, card_token: string): Promise<RegisterCreditCardResult>;
}
