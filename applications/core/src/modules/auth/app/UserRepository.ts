import User, { UserObject } from "@auth/domain/User";
import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";

export type UsersFilter = {
  tenant_id?: string;
  page_options?: PageOptions;
};

export default interface UserRepository {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
  getUsers(filter?: UsersFilter): Promise<PaginatedResult<UserObject>>;
}
