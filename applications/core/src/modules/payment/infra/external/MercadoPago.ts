import PaymentGateway, { Customer, PaymentResult, RegisterCreditCardResult, RegisterCustomerResult } from "@payment/app/PaymentGateway";
import Payment, { PaymentStatus } from "@payment/domain/Payment";
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
  readonly #base_url: string;
  readonly #client_id: string;
  readonly #webhook_url: string;
  #access_token: string | null = null;
  #token_expired_at: Date = new Date();
  #status: Record<string, PaymentStatus> = {
    approved: PaymentStatus.PAID,
    cancelled: PaymentStatus.CANCELED,
    pending: PaymentStatus.PENDING,
    rejected: PaymentStatus.REJECTED,
  };
  #reasons: Record<string, string> = {
    accredited: 'Pagamento creditado.',
    partially_refunded: 'O pagamento foi feito com pelo menos um reembolso parcial.',
    partially_bpp_refunded: 'A mediação foi favorável ao pagador e o pagamento parcialmente devolvido.',
    partially_bpp_covered: 'A mediação foi favorável tanto ao pagador quanto ao vendedor e o pagamento é parcialmente devolvido a ambos.',
    pending_capture: 'O pagamento foi autorizado e aguarda captura.',
    by_collector: 'Caso o status seja cancelled, significa que o pagamento foi cancelado pelo collector.',
    by_payer: 'Caso o status seja cancelled, significa que o pagamento foi cancelado pelo pagador.',
    by_admin: 'Caso o status seja cancelled, o pagamento foi cancelado pelo administrador. Caso o status seja refunded, o pagamento foi devolvido.',
    expired: 'Caso o status seja cancelled, significa que o pagamento foi cancelado após ficar com status pendente por 30 dias.',
    offline_process: 'Por falta de processamento online, o pagamento está sendo processado de maneira offline',
    pending_contingency: 'Falha temporária. O pagamento será processado diferido.',
    pending_review_manual: 'O pagamento está em revisão para determinar sua aprovação ou rejeição.',
    pending_provider_response: 'O pagamento está pendente, aguardando resposta do servidor.',
    pending_waiting_transfer: 'Nos casos de transferência bancária, o status_detail é obtido aguardando que o usuário finalize o processo de pagamento no seu banco.',
    pending_waiting_for_remedy: 'Nos casos de pagamentos offline, o mesmo fica pendente até que o usuário regularize a situação.',
    pending_waiting_payment: 'Nos casos de pagamentos offline, o mesmo fica pendente até que o usuário realize o pagamento.',
    pending_challenge: 'Nos casos de pagamentos com cartão de crédito, há uma confirmação pendente por devido a um challenge.',
    in_process: 'Para pagamentos com o status charged_back, o pagamento está em processo de recuperação pois o pagador desconhece a transação.',
    settled: 'Para pagamentos com o status charged_back, o dinheiro foi retido após um processo de estorno.',
    reimbursed: 'Para pagamentos com o status charged_back, o dinheiro foi devolvido após um processo de estorno.',
    refunded: 'O pagamento foi devolvido pelo collector.',
    bpp_refunded: 'A mediação foi favorável ao pagador, mas o Mercado Pago cobre a devolução do dinheiro.',
    bpp_covered: 'A mediação foi favorável tanto ao pagador quanto ao vendedor, portanto, ambos estão cobertos.',
    bank_rejected: 'Se a forma de pagamento for transferência bancária, o banco rejeitou o pagamento.',
    bank_error: 'Se a forma de pagamento for transferência bancária, o pagamento foi rejeitado devido a um erro com o banco.',
    cc_rejected_3ds_challenge: 'Pagamento rejeitado por não superar o challenge 3DS.',
    cc_rejected_3ds_mandatory: 'Pagamento rejeitado por não ter o challenge 3DS quando é obrigatório.',
    cc_rejected_bad_filled_card_number: 'Número de cartão incorreto.',
    cc_rejected_bad_filled_date: 'Data de validade incorreta.',
    cc_rejected_bad_filled_other: 'Detalhes do cartão incorretos.',
    cc_rejected_bad_filled_security_code: 'Código de segurança (CVV) incorreto.',
    cc_rejected_blacklist: 'O cartão está desativado, presente em problemas de roubo/reclamações/fraude.',
    cc_rejected_call_for_authorize: 'O método de pagamento requer autorização prévia para o valor da transação, que o pagador deverá resolver junto à entidade.',
    cc_rejected_card_disabled: 'O cartão está inativo.',
    cc_rejected_duplicated_payment: 'Pagamento recusado porque a transação está duplicada do lado do fornecedor do cartão.',
    cc_rejected_high_risk: 'Recusado por prevenção de fraudes.',
    cc_rejected_insufficient_amount: 'O limite do cartão é insuficiente para esta transação.',
    cc_rejected_invalid_installments: 'Número inválido de parcelas.',
    cc_rejected_max_attempts: 'Foi excedido o número máximo de tentativas.',
    cc_rejected_other_reason: 'Erro genérico.',
    cc_rejected_time_out: 'A transação foi rejeitada devido ao limite de tempo.',
    cc_amount_rate_limit_exceeded: 'Rejeitado porque superou o limite (CAP - Capacidade Máxima Permitida) do meio de pagamento.',
    rejected_high_risk: 'Rejeitado por avaliação de risco, pontuação de crédito ou suspeita de fraude.',
    rejected_insufficient_data: 'Rejeitado devido à falta de todas as informações obrigatórias necessárias no pagamento.',
    rejected_by_bank: 'Operação recusada pelo banco',
    rejected_by_regulations: 'Pagamento recusado devido a regulamentações.',
    collector_unavailable: 'Em caso de pagamento rejeitado, o collector tem restrição e não pode operar.',
    payer_unavailable: 'Em caso de pagamento rejeitado, o pagador tem restrição e não pode operar.',
  };

  constructor() {
    this.#base_url = process.env.MP_BASE_URL!;
    this.#client_id = process.env.MP_CLIENT_ID!;
    this.#webhook_url = `${process.env.WEBHOOK_PAYMENT_BASE_URL}/mp`;
  }

  async getPayment(external_id: string): Promise<PaymentResult | null> {
    const access_token = await this.auth();
    const response = await fetch(`${this.#base_url}/v1/payments/${external_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status >= 400) {
      throw new PaymentError('Get payment error', await response.json());
    }

    const data = await response.json() as PaymentResponseData;

    return {
      payment_id: data.external_reference,
      status: this.#status[data.status],
      reason: this.#reasons[data.status_detail],
      payload: JSON.stringify(data),
    };
  }

  async makePayment(payment: Payment): Promise<PaymentLog> {
    const access_token = await this.auth();
    const payment_obj = payment.toObject();
    const response = await fetch(`${this.#base_url}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
        'X-Idempotency-Key': payment.id,
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
      throw new PaymentError('Payment error', await response.json());
    }

    const data = await response.json() as PaymentResponseData;

    return new PaymentLog({
      external_id: data.id,
      payment_id: payment.id,
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
      throw new PaymentError('Create customer error', await response.json());
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
      throw new PaymentError('Credit card error', await response.json());
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
