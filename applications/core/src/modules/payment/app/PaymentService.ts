import { PaymentProps } from "@payment/domain/Payment";
import { PaymentLogProps } from "@payment/domain/PaymentLog";
import Either from "@shared/utils/Either";
import { PageOptions } from "@shared/utils/Pagination";
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

export default class PaymentService {
  #payment_repository: PaymentRepository;
  #payment_log_repository: PaymentLogRepository;

  constructor(payment_repository: PaymentRepository, payment_log_repository: PaymentLogRepository) {
    this.#payment_repository = payment_repository;
    this.#payment_log_repository = payment_log_repository;
  }

  async getSubscriptionPayments(params: GetSubscriptionPaymentsParams): Promise<Either<PaymentProps[]>> {
    const payments = await this.#payment_repository.getPayments({ subscription_id: params.subscription_id });

    return Either.right(payments);
  }

  async getPaymentLogs(params: GetPaymentLogsParams): Promise<Either<PaymentLogProps[]>> {
    return Either.left(new Error());
  }

  async createPayment(params: CreatePaymentParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async processPayment(params: ProcessPaymentParams): Promise<Either<void>> {
    return Either.left(new Error());
  }
}
