import AccessPlanRepository from "@auth/app/AccessPlanRepository";
import AccessPlan from "@auth/domain/AccessPlan";

export default class DbAccessPlanRepository implements AccessPlanRepository {
  getAccessPlans(): Promise<AccessPlan[]> {
    throw new Error("Method not implemented.");
  }
  createAccessPlan(access_plan: AccessPlan): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateAccessPlan(access_plan: AccessPlan): Promise<void> {
    throw new Error("Method not implemented.");
  }
}