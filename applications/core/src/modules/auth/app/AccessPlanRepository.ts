import AccessPlan from "@auth/domain/AccessPlan";

export default interface AccessPlanRepository {
  getAccessPlans(): Promise<Array<AccessPlan>>;
  createAccessPlan(access_plan: AccessPlan): Promise<void>;
  updateAccessPlan(access_plan: AccessPlan): Promise<void>;
}