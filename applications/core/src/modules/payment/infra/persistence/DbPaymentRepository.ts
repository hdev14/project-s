import PaymentRepository, { PaymentsFilter } from "@payment/app/PaymentRepository";
import Payment, { PaymentProps } from "@payment/domain/Payment";
import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";

export default class DbPaymentRepository extends DefaultRepository implements PaymentRepository {
  #columns = [
    "p.id",
    "p.amount",
    "p.status",
    "p.subscription_id",
    "p.tenant_id",
    "p.created_at",
    "p.updated_at",
    "u.id as user_id",
    "u.document",
    "u.email",
    "u.created_at as user_created_at",
    "u.updated_at as user_updated_at"
  ];
  #select_payments = `SELECT ${this.#columns.toString()} FROM payments p JOIN subscriptions s ON p.subscription_id = s.id JOIN users u ON s.subscriber_id = u.id`;

  async getPayments(filter: PaymentsFilter): Promise<PaymentProps[]> {
    const result = await this.db.query(this.#select_payments + ' WHERE p.subscription_id=$1', [filter.subscription_id]);

    const payments: PaymentProps[] = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      const row = result.rows[idx];
      payments.push({
        id: row.id,
        amount: parseFloat(row.amount),
        status: row.status,
        subscription_id: row.subscription_id,
        tenant_id: row.tenant_id,
        tax: parseFloat(row.tax),
        customer: {
          id: row.user_id,
          documnt: row.document,
          email: row.email,
          credit_card_external_id: row.credit_card_external_id,
          created_at: row.user_created_at,
          updated_at: row.user_updated_at,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }

    return payments;
  }

  async createPayment(payment: Payment): Promise<void> {
    const obj = payment.toObject();

    const data = {
      id: obj.id,
      amount: obj.amount,
      tax: obj.tax,
      status: obj.status,
      subscription_id: obj.subscription_id,
      tenant_id: obj.tenant_id,
      created_at: obj.created_at,
      updated_at: obj.updated_at,
    };

    const values = Object.values(data);

    await this.db.query(
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

    await this.db.query(
      `UPDATE payments SET ${DbUtils.setColumns(data)} WHERE id=$1`,
      DbUtils.sanitizeValues(Object.values(data))
    );
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const result = await this.db.query(this.#select_payments + ' WHERE p.id=$1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return Payment.fromObject({
      id: row.id,
      amount: parseFloat(row.amount),
      status: row.status,
      subscription_id: row.subscription_id,
      tenant_id: row.tenant_id,
      tax: parseFloat(row.tax),
      customer: {
        id: row.user_id,
        documnt: row.document,
        email: row.email,
        credit_card_external_id: row.credit_card_external_id,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
