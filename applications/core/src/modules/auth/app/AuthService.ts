import User, { UserObject } from "@auth/domain/User";
import CredentialError from "@shared/errors/CredentialError";
import NotFoundError from "@shared/errors/NotFoundError";
import Either from "@shared/utils/Either";
import { PaginationOptions } from "@shared/utils/Pagination";
import { randomUUID } from "crypto";
import AccessPlanRepository from "./AccessPlanRepository";
import AuthTokenManager, { TokenResult } from "./AuthTokenManager";
import Encryptor from "./Encryptor";
import PolicyRepository from "./PolicyRepository";
import UserRepository from "./UserRepository";

export type LoginResult = {
  user: UserObject;
  auth: TokenResult;
};

export type UserParams = {
  email: string;
  password: string;
};

export type LoginParams = UserParams;

export type RegisterUserParams = UserParams & { access_plan_id?: string };

export type UpdateUserParams = Partial<UserParams> & { user_id: string };

export type UpdatePoliciesParams = {
  user_id: string,
  policy_slugs: Array<string>;
};

export type GetUsersParams = {
  pagination?: PaginationOptions;
};

export default class AuthService {
  #encryptor: Encryptor;
  #auth_token_manager: AuthTokenManager;
  #user_repository: UserRepository;
  #policy_repository: PolicyRepository;
  #access_plan_repository: AccessPlanRepository;

  constructor(
    encryptor: Encryptor,
    auth_token_manager: AuthTokenManager,
    user_repository: UserRepository,
    policy_repository: PolicyRepository,
    access_plan_repository: AccessPlanRepository,
  ) {
    this.#encryptor = encryptor;
    this.#auth_token_manager = auth_token_manager;
    this.#user_repository = user_repository;
    this.#policy_repository = policy_repository;
    this.#access_plan_repository = access_plan_repository;
  }

  async login(params: LoginParams): Promise<Either<LoginResult>> {
    const user = await this.#user_repository.getUserByEmail(params.email);

    if (!user) {
      return Either.left(new NotFoundError('Usuário não encontrado'));
    }

    const user_obj = user.toObject();
    if (!this.#encryptor.compareHash(params.password, user_obj.password)) {
      return Either.left(new CredentialError());
    }

    const token_result = this.#auth_token_manager.generateToken(user_obj);

    return Either.right({
      user: user_obj,
      auth: token_result,
    });
  }

  async registerUser(params: RegisterUserParams): Promise<Either<UserObject>> {
    if (params.access_plan_id !== undefined) {
      const access_plan = await this.#access_plan_repository.getAccessPlanById(params.access_plan_id);
      if (!access_plan) {
        return Either.left(new NotFoundError('Plano de acesso não encontrado'));
      }
    }

    const user = new User({
      id: randomUUID(),
      email: params.email,
      password: this.#encryptor.createHash(params.password),
      policies: [],
      access_plan_id: params.access_plan_id,
    });

    await this.#user_repository.createUser(user);

    return Either.right(user.toObject());
  }

  async updateUser(params: UpdateUserParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async updatePolicies(params: UpdatePoliciesParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async getUsers(params: GetUsersParams): Promise<Array<UserObject>> {
    return Either.left(new Error());
  }

  async changeAccessPlan(params: {}): Promise<Either<void>> {
    return Either.left(new Error());
  }
}