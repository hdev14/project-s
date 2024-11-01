import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";
import Subscription, { SubscriptionProps } from "@subscription/domain/Subscription";

export type SubscriptionsFilter = {
  tenant_id: string;
  page_options?: PageOptions;
}

export default interface SubscriptionRepository {
  createSubscription(subscription: Subscription): Promise<void>;
  updateSubscription(subscription: Subscription): Promise<void>;
  getSubscriptionById(id: string): Promise<Subscription | null>;
  getSubscriptions(filter: SubscriptionsFilter): Promise<PaginatedResult<SubscriptionProps>>;
}
