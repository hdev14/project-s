import PaymentLogRepository, { PaymentLogFilter } from "@payment/app/PaymentLogRepository";
import PaymentLog, { PaymentLogProps } from "@payment/domain/PaymentLog";
import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";
import Page from "@shared/utils/Page";

export default class DbPaymentLogRepository extends DefaultRepository implements PaymentLogRepository {
  async createPaymentLog(payment_log: PaymentLog): Promise<void> {
    const data = payment_log.toObject();
    const values = Object.values(data);

    await this.db.query(
      `INSERT INTO payment_logs ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values)
    );
  }

  async getPaymentLogs(filter: PaymentLogFilter): Promise<Page<PaymentLogProps>> {
    const { rows, page_result } = await this.selectPaymentLogs(filter);

    const result = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      result.push(PaymentLog.fromObject({
        id: row.id,
        external_id: row.external_id,
        payload: row.payload,
        payment_id: row.payment_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    }

    return new Page(result, page_result);
  }

  private async selectPaymentLogs(filter: PaymentLogFilter) {
    const query = `SELECT * FROM payment_logs WHERE payment_id=$1`;
    const values: unknown[] = [filter.payment_id];

    if (filter.page_options) {
      return await this.getRowsPaginated({
        main_query: query,
        count_query: 'SELECT COUNT(id) as total FROM payment_logs WHERE payment_id=$1',
        page_options: filter.page_options,
        values,
      });
    }

    const { rows } = await this.db.query(query, DbUtils.sanitizeValues(values));

    return { rows, page_result: undefined };
  }
}
