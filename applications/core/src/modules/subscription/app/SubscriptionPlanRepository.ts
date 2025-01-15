import Collection from "@shared/utils/Collection";
import Page from "@shared/utils/Page";
import { PageOptions } from "@shared/utils/Pagination";
import SubscriptionPlan, { SubscriptionPlanProps } from "@subscription/domain/SubscriptionPlan";

export type SubscriptionPlansFilter = {
  tenant_id: string;
  page_options?: PageOptions;
};

export interface SubscriptionPlanRepository {
  getSubscriptionPlans(filter: SubscriptionPlansFilter): Promise<Page<SubscriptionPlanProps>>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null>;
  createSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void>;
  getSubscriptionPlansByIds(ids: string[]): Promise<Collection<SubscriptionPlanProps>>;
  updateSubscriptionPlan(subscription_plan: SubscriptionPlan): Promise<void>;
}
