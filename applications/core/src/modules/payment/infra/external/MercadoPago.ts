import PaymentGateway, { Customer, RegisterCreditCardResult, RegisterCustomerResult } from "@payment/app/PaymentGateway";
import Payment from "@payment/domain/Payment";
import PaymentLog from "@payment/domain/PaymentLog";
import PaymentError from "@shared/errors/PaymentError";

type AuthResponseData = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: string;
  refresh_token: string;
  public_key: string;
  live_mode: boolean;
}

type CustomerResponseData = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: Record<string, any>;
  identification: Record<string, any>;
  address: Record<string, any>;
  description: string;
  date_created: string;
  metadata: Record<string, any>;
  default_address?: string;
  cards: Array<Record<string, any>>;
  addresses: Array<Record<string, any>>;
  live_mode: boolean;
}

type CreditCardResponseData = {
  id: string;
  expiration_month: string;
  expiration_year: string;
  first_six_digits: string;
  last_four_digits: string;
  payment_method: Record<string, any>;
  security_code: Record<string, any>;
  issuer: Record<string, any>;
  cardholder: Record<string, any>;
  date_created: string;
  date_last_updated: string;
  customer_id: string;
  user_id: string;
  live_mode: boolean;
}

type PaymentResponseData = {
  id: string;
  date_created: string;
  date_approved: string;
  date_last_updated: string;
  money_release_date: string;
  issuer_id: string;
  payment_method_id: string;
  payment_type_id: string;
  status: string;
  status_detail: string;
  currency_id: string;
  description: string;
  taxes_amount: number;
  shipping_amount: number;
  collector_id: string;
  payer: Record<string, any>;
  metadata: Record<string, any>;
  additional_info: Record<string, any>;
  external_reference: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  transaction_details: Record<string, any>;
  fee_details: Array<Record<string, any>>;
  statement_descriptor: string;
  installments: number;
  card: Record<string, any>;
  notification_url: string;
  processing_mode: string;
  point_of_interaction: Record<string, any>;
}

export default class MercadoPago implements PaymentGateway {
  #base_url: string;
  #client_id: string;
  #access_token: string | null = null;
  #token_expired_at: Date = new Date();
  #webhook_url: string;

  constructor() {
    this.#base_url = process.env.MP_BASE_URL!;
    this.#client_id = process.env.MP_CLIENT_ID!;
    this.#webhook_url = `${process.env.WEBHOOK_PAYMENT_BASE_URL}/mp`;
  }

  async makeTransaction(payment: Payment): Promise<PaymentLog> {
    const access_token = await this.auth();
    const payment_obj = payment.toObject();
    const response = await fetch(`${this.#base_url}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        external_reference: payment_obj.id,
        transaction_amount: payment_obj.amount,
        statement_descriptor: 'PROJECT_S',
        description: "Pagamento de assinatura",
        installments: 1,
        token: payment_obj.customer.credit_card_external_id,
        metadata: payment_obj,
        callback_url: `${this.#webhook_url}/${payment_obj.id}`,
        binary_mode: true,
        payer: {
          email: payment_obj.customer.email,
          identification: {
            type: 'CPF',
            number: payment_obj.customer.documnt,
          }
        }
      })
    });

    if (response.status >= 400) {
      const data: any = await response.json();
      throw new PaymentError('Transaction error', data);
    }

    const data: any = await response.json() as PaymentResponseData;

    return new PaymentLog({
      external_id: data.id,
      payload: JSON.stringify(data),
    });
  }

  async registerCustomer(customer: Customer): Promise<RegisterCustomerResult> {
    const access_token = await this.auth();

    const response = await fetch(`${this.#base_url}/v1/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        email: customer.email,
        identification: {
          type: 'CPF',
          number: customer.document,
        }
      }),
    });

    if (response.status >= 400) {
      const data: any = await response.json();
      throw new PaymentError('Create customer error', data);
    }

    const data = await response.json() as CustomerResponseData;

    return {
      id: data.id,
      document: customer.document,
      email: customer.email,
    };
  }

  async registerCreditCard(external_customer_id: string, card_token: string): Promise<RegisterCreditCardResult> {
    const access_token = await this.auth();

    const response = await fetch(`${this.#base_url}/v1/customers/${external_customer_id}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ token: card_token }),
    });

    if (response.status >= 400) {
      const data: any = await response.json();
      throw new PaymentError('Credit card error', data);
    }

    const data = await response.json() as CreditCardResponseData;

    return { credit_card_id: data.id };
  }

  private async auth() {
    if (this.#access_token === null || this.#token_expired_at <= new Date()) {
      const response = await fetch(`${this.#base_url}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.#client_id,
          client_secret: 'client_secret',
          grant_type: 'client_credentials',
        }),
      });

      if (response.status >= 400) {
        throw new Error();
      }

      const data = await response.json() as AuthResponseData;

      this.#token_expired_at = new Date();
      this.#token_expired_at.setSeconds(this.#token_expired_at.getSeconds() + data.expires_in);
      this.#access_token = data.access_token;

      return this.#access_token;
    }

    return this.#access_token;
  }
}
