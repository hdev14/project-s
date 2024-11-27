import Payment, { PaymentProps, PaymentStatus } from "@payment/domain/Payment";
import { PaymentLogProps } from "@payment/domain/PaymentLog";
import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import Mediator from "@shared/Mediator";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import PaymentGateway from "./PaymentGateway";
import PaymentLogRepository from "./PaymentLogRepository";
import PaymentRepository from "./PaymentRepository";

type GetSubscriptionPaymentsParams = {
  subscription_id: string;
}

type GetPaymentLogsParams = {
  payment_id: string;
  page_options?: PageOptions;
}

type CreatePaymentParams = {
  subscription_id: string;
  customer_id: string;
  tenant_id: string;
  amount: number;
};

type ProcessPaymentParams = {
  payment_id: string;
};

export type GetPaymentLogsResult = {
  results: Array<PaymentLogProps>;
  page_result?: PageResult;
};

export default class PaymentService {
  #payment_repository: PaymentRepository;
  #payment_log_repository: PaymentLogRepository;
  #mediator: Mediator;
  #payment_gateway: PaymentGateway;

  constructor(
    payment_repository: PaymentRepository,
    payment_log_repository: PaymentLogRepository,
    mediator: Mediator,
    payment_gateway: PaymentGateway,
  ) {
    this.#payment_repository = payment_repository;
    this.#payment_log_repository = payment_log_repository;
    this.#mediator = mediator;
    this.#payment_gateway = payment_gateway;
  }

  async getSubscriptionPayments(params: GetSubscriptionPaymentsParams): Promise<Either<PaymentProps[]>> {
    const payments = await this.#payment_repository.getPayments({ subscription_id: params.subscription_id });

    return Either.right(payments);
  }

  async getPaymentLogs(params: GetPaymentLogsParams): Promise<Either<GetPaymentLogsResult>> {
    const { results, page_result } = await this.#payment_log_repository.getPaymentLogs({
      payment_id: params.payment_id,
      page_options: params.page_options,
    });

    return Either.right({ results, page_result });
  }

  async createPayment(params: CreatePaymentParams): Promise<Either<void>> {
    const subscriber = await this.#mediator.send<any>(new GetSubscriberCommand(params.customer_id));

    if (!subscriber) {
      return Either.left(new NotFoundError('notfound.subscriber'));
    }

    const payment = new Payment({
      amount: params.amount,
      customer: {
        id: subscriber.id,
        documnt: subscriber.document,
        email: subscriber.email,
        credit_card_external_id: subscriber.payment_method.credit_card_external_id,
      },
      status: PaymentStatus.PENDING,
      subscription_id: params.subscription_id,
      tax: 0, // TODO: add logic to calculate the tax
      tenant_id: params.tenant_id,
    });

    const payment_log = await this.#payment_gateway.makeTransaction(payment);

    await this.#payment_repository.createPayment(payment);

    await this.#payment_log_repository.createPaymentLog(payment_log);

    return Either.right();
  }

  async processPayment(params: ProcessPaymentParams): Promise<Either<void>> {
    return Either.left(new Error());
  }
}
