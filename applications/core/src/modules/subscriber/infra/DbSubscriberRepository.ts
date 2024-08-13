import Database from "@shared/infra/Database";
import Collection from "@shared/utils/Collection";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import SubscriberRepository, { SubscribersFilter } from "@subscriber/app/SubscriberRepository";
import Subscriber from "@subscriber/domain/Subscriber";
import { SubscriptionObject } from "@subscriber/domain/Subscription";
import { Pool } from "pg";

export default class DbSubscriberRepository implements SubscriberRepository {
  #db: Pool;
  static #subscriber_columns = [
    'id',
    'email',
    'document',
    'phone_number',
    'street',
    'district',
    'state',
    'number',
    'complement',
    'payment_type',
    'credit_card_external_id',
  ];

  constructor() {
    this.#db = Database.connect();
  }

  async getSubcriberById(id: string): Promise<Subscriber | null> {
    const subscriber_result = await this.#db.query(
      `SELECT ${DbSubscriberRepository.#subscriber_columns.toString()} FROM users WHERE type="customer" AND id=$1`,
      [id]
    );

    if (subscriber_result.rows.length === 0) {
      return null;
    }

    const subscriber_row = subscriber_result.rows[0];

    const subscriptions_result = await this.#db.query(
      'SELECT * FROM subscriptions WHERE subscriber_id=$1',
      [subscriber_row.id]
    );

    return new Subscriber({
      id: subscriber_row.id,
      email: subscriber_row.email,
      document: subscriber_row.document,
      phone_number: subscriber_row.phone_number,
      address: {
        street: subscriber_row.street,
        district: subscriber_row.district,
        number: subscriber_row.number,
        state: subscriber_row.state,
        complement: subscriber_row.state,
      },
      payment_method: {
        payment_type: subscriber_row.payment_type,
        credit_card_external_id: subscriber_row.credit_card_external_id,
      },
      subscriptions: this.mapSubscriptions(subscriptions_result.rows, subscriber_row.id),
    });
  }

  async getSubscribers(filter?: SubscribersFilter): Promise<PaginatedResult<Subscriber>> {
    const { rows, page_result } = await this.selectSubscribers(filter);

    const subscriber_ids = [];

    for (let idx = 0; idx < rows.length; idx++) {
      subscriber_ids.push(rows[idx].id);
    }

    const { rows: subscription_rows } = await this.#db.query(
      `SELECT * FROM subscriptions WHERE subscriber_id ${DbUtils.inOperator(subscriber_ids)}`,
      subscriber_ids
    );

    const subscribers: Subscriber[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const subscriber_row = rows[idx];

      subscribers.push(new Subscriber({
        id: subscriber_row.id,
        email: subscriber_row.email,
        document: subscriber_row.document,
        phone_number: subscriber_row.phone_number,
        address: {
          street: subscriber_row.street,
          district: subscriber_row.district,
          number: subscriber_row.number,
          state: subscriber_row.state,
          complement: subscriber_row.state,
        },
        payment_method: {
          payment_type: subscriber_row.payment_type,
          credit_card_external_id: subscriber_row.credit_card_external_id,
        },
        subscriptions: this.mapSubscriptions(subscription_rows, subscriber_row.id),
      }));
    }

    return { results: new Collection(subscribers), page_result };
  }

  private mapSubscriptions(subscription_rows: any[], subscriber_id: string) {
    const subscriptions: SubscriptionObject[] = [];

    for (let h = 0; h < subscription_rows.length; h++) {
      const subscription_row = subscription_rows[h];
      if (subscription_row.subscriber_id === subscriber_id) {
        subscriptions.push({
          id: subscription_row.id,
          amount: subscription_row.amount,
          started_at: subscription_row.started_at,
        });
      }
    }

    return subscriptions;
  }

  private async selectSubscribers(filter?: SubscribersFilter) {
    const query = `SELECT ${DbSubscriberRepository.#subscriber_columns.toString()} FROM users WHERE type="customer"`;

    if (filter && filter.page_options) {
      const offset = Pagination.calculateOffset(filter.page_options);
      const count_query = 'SELECT count(id) as total FROM users WHERE type="customer"';
      const count_result = await this.#db.query(count_query);

      const paginated_query = query + ' LIMIT $1 OFFSET $2';

      const { rows } = await this.#db.query(
        paginated_query,
        DbUtils.sanitizeValues([filter.page_options.limit, offset])
      );

      const page_result = (count_result.rows[0].total !== undefined && count_result.rows[0].total > 0)
        ? Pagination.calculatePageResult(count_result.rows[0].total, filter!.page_options!)
        : undefined;

      return { rows, page_result };
    }

    const { rows } = await this.#db.query(query);

    return { rows };
  }

  createSubscriber(subscriber: Subscriber): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async updateSubscriber(subscriber: Subscriber): Promise<void> {
    const { id, document, email, phone_number, address, payment_method } = subscriber.toObject();
    const data = Object.assign({}, { id, document, email, phone_number }, address, payment_method);

    await this.#db.query(
      `UPDATE users SET ${DbUtils.setColumns(data)} WHERE type="customer" AND id=$1`,
      DbUtils.sanitizeValues(Object.values(data))
    );
  }
}
