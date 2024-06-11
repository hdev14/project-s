import PolicyRepository from "@auth/app/PolicyRepository";
import Policy from "@auth/domain/Policy";
import PaginationOptions from "@share/PaginationOptions";

export default class DbPolicyRepository implements PolicyRepository {
  getPolicies(pagination: PaginationOptions): Promise<Policy[]> {
    throw new Error("Method not implemented.");
  }
  getPolicyBySlug(slug: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  createPolicy(policy: Policy): Promise<void> {
    throw new Error("Method not implemented.");
  }
  deletePolicy(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}