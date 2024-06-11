import UserRepository from "@auth/app/UserRepository";
import User from "@auth/domain/User";

export default class DbUserRepository implements UserRepository {
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