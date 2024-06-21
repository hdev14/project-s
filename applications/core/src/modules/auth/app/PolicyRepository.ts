import Policy from "@auth/domain/Policy";

export type PolicyFilter = {
  slugs?: Array<string>;
}

export default interface PolicyRepository {
  getPolicies(filter?: PolicyFilter): Promise<Array<Policy>>;
  getPolicyBySlug(slug: string): Promise<Policy | null>;
  createPolicy(policy: Policy): Promise<void>;
  deletePolicy(id: string): Promise<void>;
}