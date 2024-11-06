import PaymentRepository from "@payment/app/PaymentRepository";
import Payment from "@payment/domain/Payment";
import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import { Pool } from "pg";

export default class DbPaymentRepository implements PaymentRepository {
  #db: Pool;
  #customer_columns = [
    'u.id',
    'u.document',
    'u.email',
    'u.credit_card_external_id',
    'u.created_at',
    'u.updated_at',
  ];

  constructor() {
    this.#db = Database.connect();
  }

  async createPayment(payment: Payment): Promise<void> {
    const obj = payment.toObject();

    const data = {
      id: obj.id,
      amount: obj.amount,
      tax: obj.tax,
      status: obj.status,
      subscription_id: obj.subscription_id,
      created_at: obj.created_at,
      updated_at: obj.updated_at,
    };

    const values = Object.values(data);

    await this.#db.query(
      `INSERT INTO payments ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values)
    );
  }

  async updatePayment(payment: Payment): Promise<void> {
    const obj = payment.toObject();

    const data = {
      id: obj.id,
      amount: obj.amount,
      tax: obj.tax,
      status: obj.status,
      subscription_id: obj.subscription_id,
      updated_at: obj.updated_at,
    };

    await this.#db.query(
      `UPDATE payments SET ${DbUtils.setColumns(data)} WHERE id=$1`,
      DbUtils.sanitizeValues(Object.values(data))
    );
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const payment_result = await this.#db.query('SELECT * FROM payments WHERE id=$1', [id]);

    if (payment_result.rows.length === 0) {
      return null;
    }

    const payment_row = payment_result.rows[0];

    const customer_result = await this.#db.query(
      `SELECT ${this.#customer_columns.toString()} FROM subscriptions s JOIN users u ON s.subscriber_id = u.id WHERE id=$1`,
      [payment_row.subscription_id]
    );

    const customer_row = customer_result.rows[0];

    return Payment.fromObject({
      id: payment_row.id,
      amount: parseFloat(payment_row.amount),
      status: payment_row.status,
      subscription_id: payment_row.subscription_id,
      tax: parseFloat(payment_row.tax),
      customer: {
        id: customer_row.id,
        documnt: customer_row.document,
        email: customer_row.email,
        credit_card_external_id: customer_row.credit_card_external_id,
        created_at: new Date(customer_row.created_at),
        updated_at: new Date(customer_row.updated_at),
      },
      created_at: new Date(payment_row.created_at),
      updated_at: new Date(payment_row.updated_at),
    })
  }
}
