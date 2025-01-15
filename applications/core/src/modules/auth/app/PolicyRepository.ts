import Policy, { PolicyProps } from "@auth/domain/Policy";
import Collection from "@shared/utils/Collection";

export type PolicyFilter = {
  slugs?: Array<string>;
}

export default interface PolicyRepository {
  getPolicies(filter?: PolicyFilter): Promise<Collection<PolicyProps>>;
  getPolicyBySlug(slug: string): Promise<Policy | null>;
}
