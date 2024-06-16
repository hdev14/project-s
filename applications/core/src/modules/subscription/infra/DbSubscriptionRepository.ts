import PaginationOptions from "@shared/PaginationOptions";
import SubscriptionRepository from "@subscription/app/SubcriptionRepository";
import Subscription from "@subscription/domain/Subscription";
import SubscriptionPlan from "@subscription/domain/SubscriptionPlan";

export default class DbSubscriptionRepository implements SubscriptionRepository {
  createSubscription(subscription: Subscription): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateSubscription(subscription: Subscription): Promise<void> {
    throw new Error("Method not implemented.");
  }
  createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getSubscriptionById(id: string): Promise<Subscription | null> {
    throw new Error("Method not implemented.");
  }
  getSubscriptions(pagination: PaginationOptions): Promise<Subscription[]> {
    throw new Error("Method not implemented.");
  }
}