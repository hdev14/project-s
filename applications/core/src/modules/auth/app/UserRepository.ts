import User from "@auth/domain/User";
import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";

export default interface UserRepository {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
  getUsers(pagination?: PageOptions): Promise<PaginatedResult<User>>;
}