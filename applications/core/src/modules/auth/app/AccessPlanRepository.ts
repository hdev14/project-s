import AccessPlan, { AccessPlanObject } from "@auth/domain/AccessPlan";

export default interface AccessPlanRepository {
  getAccessPlans(): Promise<Array<AccessPlanObject>>;
  createAccessPlan(access_plan: AccessPlan): Promise<void>;
  updateAccessPlan(access_plan: AccessPlan): Promise<void>;
  getAccessPlanById(id: string): Promise<AccessPlan | null>;
}
