import Payment from "@payment/domain/Payment";
import PaymentLog from "@payment/domain/PaymentLog";

export type Customer = {
  document: string;
  email: string;
};

export type RegisterCustomerResult = Customer & { id: string };

export type RegisterCreditCardResult = {
  id: string,
  digits: string;
  issuer: string;
};

export type TransactionParams = {
  payment: Payment;
  customer: Customer;
  card_token: string;
};

export default interface PaymentGateway {
  makeTransaction(params: TransactionParams): Promise<PaymentLog>;
  registerCustomer(customer: Customer): Promise<RegisterCustomerResult>;
  updateCustomer(customer: Partial<Customer>): Promise<void>;
  registerCreditCard(customer_id: string, card_token: string): Promise<RegisterCreditCardResult>;
}