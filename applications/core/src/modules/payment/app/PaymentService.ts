import Payment, { PaymentProps, PaymentStatus } from "@payment/domain/Payment";
import PaymentLog, { PaymentLogProps } from "@payment/domain/PaymentLog";
import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import UpdateSubscriptionCommand from "@shared/commands/UpdateSubscriptionCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import Mediator from "@shared/Mediator";
import types from "@shared/types";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
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
  external_id: string;
  status: PaymentStatus;
  reason?: string;
  payload: Record<string, any>;
};

export type GetPaymentLogsResult = {
  result: Array<PaymentLogProps>;
  page_result?: PageResult;
};

@injectable()
export default class PaymentService {
  readonly #payment_repository: PaymentRepository;
  readonly #payment_log_repository: PaymentLogRepository;
  readonly #mediator: Mediator;
  readonly #payment_gateway: PaymentGateway;

  constructor(
    @inject(types.PaymentRepository) payment_repository: PaymentRepository,
    @inject(types.PaymentLogRepository) payment_log_repository: PaymentLogRepository,
    @inject(types.Mediator) mediator: Mediator,
    @inject(types.PaymentGateway) payment_gateway: PaymentGateway,
  ) {
    this.#payment_repository = payment_repository;
    this.#payment_log_repository = payment_log_repository;
    this.#mediator = mediator;
    this.#payment_gateway = payment_gateway;
  }

  async getSubscriptionPayments(params: GetSubscriptionPaymentsParams): Promise<Either<PaymentProps[]>> {
    const collection = await this.#payment_repository.getPayments({ subscription_id: params.subscription_id });

    return Either.right(collection.toArray());
  }

  async getPaymentLogs(params: GetPaymentLogsParams): Promise<Either<GetPaymentLogsResult>> {
    const page = await this.#payment_log_repository.getPaymentLogs({
      payment_id: params.payment_id,
      page_options: params.page_options,
    });

    return Either.right(page.toRaw());
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
    const payment = await this.#payment_repository.getPaymentById(params.payment_id);

    if (!payment) {
      return Either.left(new NotFoundError('notfound.payment'));
    }

    if (params.status === PaymentStatus.PAID) {
      payment.pay();
    }

    if (params.status === PaymentStatus.REJECTED) {
      payment.reject(params.reason!);
    }

    if (params.status === PaymentStatus.CANCELED) {
      payment.cancel(params.reason!);
    }

    const payment_log = new PaymentLog({
      external_id: params.external_id,
      payload: JSON.stringify(params.payload),
      payment_id: payment.id,
    });

    await this.#payment_repository.updatePayment(payment);
    await this.#payment_log_repository.createPaymentLog(payment_log);

    const payment_obj = payment.toObject();

    await this.#mediator.send(
      new UpdateSubscriptionCommand({
        customer_email: payment_obj.customer.email,
        subscription_id: payment_obj.subscription_id,
        pause_subscription: payment_obj.status !== PaymentStatus.PAID,
        reason: payment_obj.refusal_reason,
      })
    );

    return Either.right();
  }
}
