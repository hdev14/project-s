import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import { PaginatedResult } from "@shared/utils/Pagination";
import SubscriptionRepository, { SubscriptionsFilter } from "@subscription/app/SubscriptionRepository";
import Subscription, { SubscriptionObject } from "@subscription/domain/Subscription";
import { Pool } from "pg";

export default class DbSubscriptionRepository implements SubscriptionRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async createSubscription(subscription: Subscription): Promise<void> {
    const subscription_obj = subscription.toObject();
    const values = Object.values(subscription_obj);
    await this.#db.query(
      `INSERT INTO subscriptions ${DbUtils.columns(subscription_obj)} VALUES ${DbUtils.values(values)}`,
      DbUtils.sanitizeValues(values)
    );
  }

  updateSubscription(subscription: Subscription): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getSubscriptionById(id: string): Promise<Subscription | null> {
    throw new Error("Method not implemented.");
  }

  getSubscriptions(filter: SubscriptionsFilter): Promise<PaginatedResult<SubscriptionObject>> {
    throw new Error("Method not implemented.");
  }
}
