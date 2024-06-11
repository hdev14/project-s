import { UserObject } from "@auth/domain/User";
import Either from "@share/Either";
import AuthTokenManager, { TokenResult } from "./AuthTokenManager";
import Encryptor from "./Encryptor";
import PolicyRepository from "./PolicyRepository";
import UserRepository from "./UserRepository";

export type LoginResult = UserObject & TokenResult;

export type UserParams = {
  email: string;
  password: string;
};

export type LoginParams = UserParams;

export type RegisterUserParams = UserParams;

export type UpdateUserParams = Partial<UserParams> & { user_id: string };

export type UpdatePoliciesParams = {
  user_id: string,
  policy_slugs: Array<string>;
};

export default class AuthService {
  #encryptor: Encryptor;
  #auth_token_manager: AuthTokenManager;
  #user_repository: UserRepository;
  #policy_repository: PolicyRepository;

  constructor(
    encryptor: Encryptor,
    auth_token_manager: AuthTokenManager,
    user_repository: UserRepository,
    policy_repository: PolicyRepository,
  ) {
    this.#encryptor = encryptor;
    this.#auth_token_manager = auth_token_manager;
    this.#user_repository = user_repository;
    this.#policy_repository = policy_repository;
  }

  async login(params: LoginParams): Promise<Either<LoginResult>> {
    return Either.left(new Error());
  }

  async registerUser(params: RegisterUserParams): Promise<Either<UserObject>> {
    return Either.left(new Error());
  }

  async updateUser(params: UpdateUserParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async updatePolicies(params: UpdatePoliciesParams): Promise<Either<void>> {
    return Either.left(new Error());
  }
}