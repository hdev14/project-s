import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";
import SubscriptionPlan, { SubscriptionPlanObject } from "@subscription/domain/SubscriptionPlan";

export type SubscriptionPlansFilter = {
  tenant_id: string;
  page_options?: PageOptions;
};

export interface SubscriptionPlanRepository {
  getSubscriptionPlans(filter: SubscriptionPlansFilter): Promise<PaginatedResult<SubscriptionPlanObject>>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null>;
  createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void>;
}
