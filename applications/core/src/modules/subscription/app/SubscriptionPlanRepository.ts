import { PaginatedResult } from "@shared/utils/Pagination";
import SubscriptionPlan from "@subscription/domain/SubscriptionPlan";

export interface SubscriptionPlanRepository {
  getSubscriptionPlans(): Promise<PaginatedResult<SubscriptionPlan>>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null>;
  createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void>;
}
