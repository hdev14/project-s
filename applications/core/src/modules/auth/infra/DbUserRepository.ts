import UserRepository from "@auth/app/UserRepository";
import User from "@auth/domain/User";
import PaginationOptions from "@shared/utils/PaginationOptions";

export default class DbUserRepository implements UserRepository {
  getUsers(pagination: PaginationOptions): Promise<User[]> {
    throw new Error("Method not implemented.");
  }
  getUserById(id: string): User {
    throw new Error("Method not implemented.");
  }
  createUser(user: User): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateUser(user: User): Promise<void> {
    throw new Error("Method not implemented.");
  }
}