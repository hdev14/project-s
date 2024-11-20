import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";
import { PaginatedResult } from "@shared/utils/Pagination";
import SubscriberRepository, { SubscribersFilter } from "@subscriber/app/SubscriberRepository";
import Subscriber, { SubscriberProps } from "@subscriber/domain/Subscriber";
import { SubscriptionProps } from "@subscriber/domain/Subscription";
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class DbSubscriberRepository extends DefaultRepository implements SubscriberRepository {
  #subscriber_columns = [
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
    'created_at',
    'updated_at',
  ];

  async getSubcriberById(id: string): Promise<Subscriber | null> {
    const subscriber_result = await this.db.query(
      `SELECT ${this.#subscriber_columns.toString()} FROM users WHERE type='customer' AND id=$1`,
      [id]
    );

    if (subscriber_result.rows.length === 0) {
      return null;
    }

    const subscriber_row = subscriber_result.rows[0];

    const subscriptions_result = await this.db.query(
      'SELECT * FROM subscriptions WHERE subscriber_id=$1',
      [subscriber_row.id]
    );

    return Subscriber.fromObject({
      id: subscriber_row.id,
      email: subscriber_row.email,
      document: subscriber_row.document,
      phone_number: subscriber_row.phone_number,
      created_at: new Date(subscriber_row.created_at),
      updated_at: new Date(subscriber_row.updated_at),
      address: {
        street: subscriber_row.street,
        district: subscriber_row.district,
        number: subscriber_row.number,
        state: subscriber_row.state,
        complement: subscriber_row.complement,
      },
      payment_method: {
        payment_type: subscriber_row.payment_type,
        credit_card_external_id: subscriber_row.credit_card_external_id,
      },
      subscriptions: this.mapSubscriptions(subscriptions_result.rows, subscriber_row.id),
    });
  }

  async getSubscribers(filter?: SubscribersFilter): Promise<PaginatedResult<SubscriberProps>> {
    const { rows, page_result } = await this.selectSubscribers(filter);

    const subscriber_ids = [];

    for (let idx = 0; idx < rows.length; idx++) {
      subscriber_ids.push(rows[idx].id);
    }

    const { rows: subscription_rows } = await this.db.query(
      `SELECT * FROM subscriptions WHERE subscriber_id ${DbUtils.inOperator(subscriber_ids)}`,
      subscriber_ids
    );

    const results = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const subscriber_row = rows[idx];

      results.push({
        id: subscriber_row.id,
        email: subscriber_row.email,
        document: subscriber_row.document,
        phone_number: subscriber_row.phone_number,
        created_at: new Date(subscriber_row.created_at),
        updated_at: new Date(subscriber_row.updated_at),
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
      });
    }

    return { results, page_result };
  }

  private mapSubscriptions(subscription_rows: any[], subscriber_id: string) {
    const subscriptions: SubscriptionProps[] = [];

    for (let h = 0; h < subscription_rows.length; h++) {
      const subscription_row = subscription_rows[h];
      if (subscription_row.subscriber_id === subscriber_id) {
        subscriptions.push({
          id: subscription_row.id,
          started_at: new Date(subscription_row.started_at),
          created_at: new Date(subscription_row.created_at),
          updated_at: new Date(subscription_row.updated_at),
        });
      }
    }

    return subscriptions;
  }

  private async selectSubscribers(filter?: SubscribersFilter) {
    const query = `SELECT ${this.#subscriber_columns.toString()} FROM users WHERE type='customer'`;

    if (filter && filter.page_options) {
      return this.getRowsPaginated({
        main_query: query,
        count_query: "SELECT count(id) as total FROM users WHERE type='customer'",
        page_options: filter.page_options,
      });
    }

    const { rows } = await this.db.query(query);

    return { rows, page_result: undefined };
  }

  async updateSubscriber(subscriber: Subscriber): Promise<void> {
    const { id, document, email, phone_number, address, payment_method, updated_at } = subscriber.toObject();
    const data = Object.assign({}, { id, document, email, phone_number, updated_at }, address, payment_method);

    await this.db.query(
      `UPDATE users SET ${DbUtils.setColumns(data)} WHERE type='customer' AND id=$1`,
      DbUtils.sanitizeValues(Object.values(data))
    );
  }
}
