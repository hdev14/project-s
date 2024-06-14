import User from "@auth/domain/User";
import PaginationOptions from "@share/utils/PaginationOptions";

export default interface UserRepository {
  getUserById(id: string): User;
  createUser(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
  getUsers(pagination: PaginationOptions): Promise<Array<User>>;
}