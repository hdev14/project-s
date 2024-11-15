import { PaymentProps } from "@payment/domain/Payment";
import { PaymentLogProps } from "@payment/domain/PaymentLog";
import Either from "@shared/utils/Either";
import { PageOptions } from "@shared/utils/Pagination";

type GetSubscriptionPaymentsParams = {
  subscription_id: string;
}

type GetPaymentLogsParams = {
  payment_id?: string;
  page_options?: PageOptions;
}

export default class PaymentService {
  async getSubscriptionPayments(params: GetSubscriptionPaymentsParams): Promise<Either<PaymentProps[]>> {
    return Either.left(new Error());
  }

  async getPaymentLogs(params: GetPaymentLogsParams): Promise<Either<PaymentLogProps[]>> {
    return Either.left(new Error());
  }
}
