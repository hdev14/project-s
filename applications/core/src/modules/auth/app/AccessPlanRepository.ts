import AccessPlan, { AccessPlanProps } from "@auth/domain/AccessPlan";
import Collection from "@shared/utils/Collection";

export default interface AccessPlanRepository {
  getAccessPlans(): Promise<Collection<AccessPlanProps>>;
  createAccessPlan(access_plan: AccessPlan): Promise<void>;
  updateAccessPlan(access_plan: AccessPlan): Promise<void>;
  getAccessPlanById(id: string): Promise<AccessPlan | null>;
}
