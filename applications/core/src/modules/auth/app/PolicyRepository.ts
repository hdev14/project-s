import Policy, { PolicyObject } from "@auth/domain/Policy";

export type PolicyFilter = {
  slugs?: Array<string>;
}

export default interface PolicyRepository {
  getPolicies(filter?: PolicyFilter): Promise<Array<PolicyObject>>;
  getPolicyBySlug(slug: string): Promise<Policy | null>;
}
