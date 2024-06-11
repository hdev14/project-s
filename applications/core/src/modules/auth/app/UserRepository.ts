import User from "@auth/domain/User";

export default interface UserRepository {
  getUserById(id: string): User;
  createUser(user: User): Promise<void>;
  updateUser(user: User): Promise<void>;
}