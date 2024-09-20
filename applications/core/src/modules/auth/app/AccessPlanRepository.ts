import AccessPlan, { AccessPlanProps } from "@auth/domain/AccessPlan";

export default interface AccessPlanRepository {
  getAccessPlans(): Promise<Array<AccessPlanProps>>;
  createAccessPlan(access_plan: AccessPlan): Promise<void>;
  updateAccessPlan(access_plan: AccessPlan): Promise<void>;
  getAccessPlanById(id: string): Promise<AccessPlan | null>;
}
