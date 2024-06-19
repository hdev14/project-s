import User from "@auth/domain/User";
import { PaginationOptions } from "@shared/utils/Pagination";

export default interface UserRepository {
  getUserById(id: string): Promise<User | null>;
  createUser(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
  getUsers(pagination?: PaginationOptions): Promise<Array<User>>;
}