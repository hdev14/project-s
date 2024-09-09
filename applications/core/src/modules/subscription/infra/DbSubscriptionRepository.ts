import { PaginatedResult } from "@shared/utils/Pagination";
import SubscriptionRepository, { SubscriptionsFilter } from "@subscription/app/SubscriptionRepository";
import Subscription, { SubscriptionObject } from "@subscription/domain/Subscription";

export default class DbSubscriptionRepository implements SubscriptionRepository {
  createSubscription(subscription: Subscription): Promise<void> {
    throw new Error("Method not implemented.");
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
