import PaymentGateway, { Customer, RegisterCreditCardResult, RegisterCustomerResult, TransactionParams } from "@payment/app/PaymentGateway";
import PaymentLog from "@payment/domain/PaymentLog";

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

export default class MercadoPago implements PaymentGateway {
  #base_url: string;
  #client_id: string;
  #access_token: string | null = null;
  #token_expired_at: Date = new Date();

  constructor() {
    this.#base_url = process.env.MP_BASE_URL!;
    this.#client_id = process.env.MP_CLIENT_ID!;
  }

  makeTransaction(params: TransactionParams): Promise<PaymentLog> {
    throw new Error("Method not implemented.");
  }

  async registerCustomer(customer: Customer): Promise<RegisterCustomerResult> {
    const access_token = await this.auth();

    const customer_response = await fetch(`${this.#base_url}/v1/customers`, {
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

    if (customer_response.status >= 400) {
      throw new Error();
    }

    const customer_data = await customer_response.json() as CustomerResponseData;

    return {
      id: customer_data.id,
      document: customer.document,
      email: customer.email,
    };
  }

  private async auth() {
    if (this.#access_token === null || this.#token_expired_at <= new Date()) {
      const auth_response = await fetch(`${this.#base_url}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.#client_id,
          client_secret: 'client_secret',
          grant_type: 'client_credentials',
        }),
      });

      if (auth_response.status >= 400) {
        throw new Error();
      }

      const auth_data = await auth_response.json() as AuthResponseData;

      this.#token_expired_at = new Date();
      this.#token_expired_at.setSeconds(this.#token_expired_at.getSeconds() + auth_data.expires_in);
      this.#access_token = auth_data.access_token;

      return this.#access_token;
    }

    return this.#access_token;
  }

  updateCustomer(customer: Partial<Customer>): Promise<void> {
    throw new Error("Method not implemented.");
  }

  registerCreditCard(customer_id: string, card_token: string): Promise<RegisterCreditCardResult> {
    throw new Error("Method not implemented.");
  }
}
