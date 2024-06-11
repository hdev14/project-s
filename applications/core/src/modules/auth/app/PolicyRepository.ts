import Policy from "@auth/domain/Policy";
import PaginationOptions from "@share/PaginationOptions";

export default interface PolicyRepository {
  getPolicies(pagination: PaginationOptions): Promise<Array<Policy>>;
  getPolicyBySlug(slug: string): Promise<void>;
  createPolicy(policy: Policy): Promise<void>;
  deletePolicy(id: string): Promise<void>;
}