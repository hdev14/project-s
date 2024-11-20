import PaymentLog, { PaymentLogProps } from "@payment/domain/PaymentLog";
import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";

export type PaymentLogFilter = {
  payment_id: string;
  page_options?: PageOptions;
};

export default interface PaymentLogRepository {
  createPaymentLog(payment_log: PaymentLog): Promise<void>;
  getPaymentLogs(filter: PaymentLogFilter): Promise<PaginatedResult<PaymentLogProps>>;
}
