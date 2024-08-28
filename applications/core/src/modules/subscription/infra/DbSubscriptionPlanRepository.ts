
import { PaginatedResult } from "@shared/utils/Pagination";
import { SubscriptionPlanRepository } from "@subscription/app/SubscriptionPlanRepository";
import SubscriptionPlan from "@subscription/domain/SubscriptionPlan";

export default class DbSubscriptionPlanRepository implements SubscriptionPlanRepository {
  getSubscriptionPlans(): Promise<PaginatedResult<SubscriptionPlan>> {
    throw new Error("Method not implemented.");
  }
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null> {
    throw new Error("Method not implemented.");
  }
  createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
