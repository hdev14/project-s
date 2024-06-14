import PaymentGateway, { Customer, RegisterCreditCardResult, RegisterCustomerResult, TransactionParams } from "@payment/app/PaymentGateway";
import PaymentLog from "@payment/domain/PaymentLog";

export default class ExternalPaymentGateway implements PaymentGateway {
  makeTransaction(params: TransactionParams): Promise<PaymentLog> {
    throw new Error("Method not implemented.");
  }
  registerCustomer(customer: Customer): Promise<RegisterCustomerResult> {
    throw new Error("Method not implemented.");
  }
  updateCustomer(customer: Partial<Customer>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  registerCreditCard(customer_id: string, card_token: string): Promise<RegisterCreditCardResult> {
    throw new Error("Method not implemented.");
  }
}