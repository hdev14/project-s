import PaymentLogRepository from "@payment/app/PaymentLogRepository";
import PaymentLog, { PaymentLogProps } from "@payment/domain/PaymentLog";
import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import { Pool } from "pg";

export default class DbPaymentLogRepository implements PaymentLogRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async createPaymentLog(payment_log: PaymentLog): Promise<void> {
    const data = payment_log.toObject();
    const values = Object.values(data);

    await this.#db.query(
      `INSERT INTO payment_logs ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values)
    );
  }

  async getPaymentLogsByPaymentId(payment_id: string): Promise<PaymentLogProps[]> {
    const result = await this.#db.query('SELECT * FROM payment_logs WHERE payment_id=$1', [payment_id]);

    const payment_logs = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      const row = result.rows[idx];
      payment_logs.push({
        id: row.id,
        external_id: row.external_id,
        payload: row.payload,
        payment_id: row.payment_id,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      });
    }

    return payment_logs;
  }
}
