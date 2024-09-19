import PaymentGateway, { Customer, RegisterCreditCardResult, RegisterCustomerResult } from "@payment/app/PaymentGateway";
import Payment from "@payment/domain/Payment";
import PaymentLog from "@payment/domain/PaymentLog";
import { randomUUID } from "crypto";
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class FakePaymentGateway implements PaymentGateway {
  #customer_results: RegisterCustomerResult[] = [];
  #credit_card_datas: { id: string, customer_id: string, card_token: string }[] = [];

  makeTransaction(payment: Payment): Promise<PaymentLog> {
    console.log('Making faker transaction', payment);

    return Promise.resolve(
      new PaymentLog({
        external_id: randomUUID(),
        payment_id: payment.id,
        payload: JSON.stringify({}),
      })
    );
  }

  registerCustomer(customer: Customer): Promise<RegisterCustomerResult> {
    const result = {
      id: randomUUID(),
      document: customer.document,
      email: customer.email,
    };

    this.#customer_results.push(result);

    return Promise.resolve(result);
  }

  registerCreditCard(external_customer_id: string, card_token: string): Promise<RegisterCreditCardResult> {
    const data = {
      id: randomUUID(),
      customer_id: external_customer_id,
      card_token
    };

    this.#credit_card_datas.push(data);

    return Promise.resolve({ credit_card_id: data.id });
  }
}
