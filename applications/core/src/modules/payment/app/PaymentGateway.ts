import Payment from "@payment/domain/Payment";
import PaymentLog from "@payment/domain/PaymentLog";

export type Customer = {
  document: string;
  email: string;
};

export type RegisterCustomerResult = Customer & { id: string };

export type RegisterCreditCardResult = {
  credit_card_id: string,
};

export default interface PaymentGateway {
  makeTransaction(payment: Payment): Promise<PaymentLog>;
  registerCustomer(customer: Customer): Promise<RegisterCustomerResult>;
  registerCreditCard(external_customer_id: string, card_token: string): Promise<RegisterCreditCardResult>;
}
