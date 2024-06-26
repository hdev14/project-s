import { PageOptions } from "@shared/utils/Pagination";
import Subscription from "@subscription/domain/Subscription";
import SubscriptionPlan from "@subscription/domain/SubscriptionPlan";

export default interface SubscriptionRepository {
  createSubscription(subscription: Subscription): Promise<void>;
  updateSubscription(subscription: Subscription): Promise<void>;
  createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void>;
  getSubscriptionById(id: string): Promise<Subscription | null>;
  getSubscriptions(pagination: PageOptions): Promise<Array<Subscription>>;
}