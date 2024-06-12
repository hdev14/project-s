import Policy from "@auth/domain/Policy";

export default interface PolicyRepository {
  getPolicies(): Promise<Array<Policy>>;
  getPolicyBySlug(slug: string): Promise<void>;
  createPolicy(policy: Policy): Promise<void>;
  deletePolicy(id: string): Promise<void>;
}