import { AccessPlanObject } from "@auth/domain/AccessPlan";
import { PolicyObject } from "@auth/domain/Policy";
import User, { UserObject } from "@auth/domain/User";
import CredentialError from "@shared/errors/CredentialError";
import NotFoundError from "@shared/errors/NotFoundError";
import types from "@shared/infra/types";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
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

export type RegisterUserParams = UserParams & {
  access_plan_id?: string;
  tenant_id?: string;
};

export type UpdateUserParams = Partial<UserParams> & { user_id: string };

export type UpdatePoliciesParams = {
  user_id: string,
  policy_slugs: Array<string>;
  mode: 'attach' | 'dettach';
};

export type GetUsersParams = {
  tenant_id?: string;
  page_options?: PageOptions;
};

export type GetUsersResult = {
  results: Array<UserObject>;
  page_result?: PageResult;
};

type ChangeAccessPlanParams = {
  user_id: string;
  access_plan_id: string;
};

@injectable()
export default class AuthService {
  #encryptor: Encryptor;
  #auth_token_manager: AuthTokenManager;
  #user_repository: UserRepository;
  #policy_repository: PolicyRepository;
  #access_plan_repository: AccessPlanRepository;

  constructor(
    @inject(types.Encryptor) encryptor: Encryptor,
    @inject(types.AuthTokenManager) auth_token_manager: AuthTokenManager,
    @inject(types.UserRepository) user_repository: UserRepository,
    @inject(types.PolicyRepository) policy_repository: PolicyRepository,
    @inject(types.AccessPlanRepository) access_plan_repository: AccessPlanRepository,
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
      return Either.left(new CredentialError());
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
      if (!access_plan.isActive()) {
        return Either.left(new Error('Plano de acesso desativado'));
      }
    }

    if (params.tenant_id !== undefined) {
      const tenant = await this.#user_repository.getUserById(params.tenant_id);
      if (!tenant) {
        return Either.left(new NotFoundError('Empresa não encontrada'));
      }
    }

    const user = new User({
      id: randomUUID(),
      email: params.email,
      password: this.#encryptor.createHash(params.password),
      policies: [],
      access_plan_id: params.access_plan_id,
      tenant_id: params.tenant_id,
    });

    await this.#user_repository.createUser(user);

    return Either.right(user.toObject());
  }

  async updateUser(params: UpdateUserParams): Promise<Either<void>> {
    const user = await this.#user_repository.getUserById(params.user_id);

    if (!user) {
      return Either.left(new NotFoundError('Usuário não encontrado'));
    }

    if (params.email) {
      user.email = params.email;
    }

    if (params.password) {
      user.password = this.#encryptor.createHash(params.password);
    }

    await this.#user_repository.updateUser(user);

    return Either.right();
  }

  async updatePolicies(params: UpdatePoliciesParams): Promise<Either<void>> {
    const user = await this.#user_repository.getUserById(params.user_id);

    if (!user) {
      return Either.left(new NotFoundError('Usuário não encontrado'));
    }

    const policies = await this.#policy_repository.getPolicies({
      slugs: params.policy_slugs,
    });

    if (params.mode === 'attach') {
      for (let idx = 0; idx < policies.length; idx++) {
        user.attachPolicy(policies[idx]);
      }
    }

    if (params.mode === 'dettach') {
      for (let idx = 0; idx < policies.length; idx++) {
        user.dettachPolicy(policies[idx]);
      }
    }

    await this.#user_repository.updateUser(user);

    return Either.right();
  }

  async getUsers(params: GetUsersParams): Promise<Either<GetUsersResult>> {
    const { results, page_result } = await this.#user_repository.getUsers(params);
    return Either.right({ results: results.toObjectList(), page_result });
  }

  async changeAccessPlan(params: ChangeAccessPlanParams): Promise<Either<void>> {
    const access_plan = await this.#access_plan_repository.getAccessPlanById(params.access_plan_id);

    if (!access_plan) {
      return Either.left(new NotFoundError('Plano de acesso não encontrado'));
    }

    const user = await this.#user_repository.getUserById(params.user_id);

    if (!user) {
      return Either.left(new NotFoundError('Usuário não encontrado'));
    }

    user.changeAccessPlan(access_plan);

    await this.#user_repository.updateUser(user);

    return Either.right();
  }

  async createAccessPlan(): Promise<Either<AccessPlanObject>> {
    return Either.left(new Error());
  }

  async updateAccessPlan(): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async getAccessPlans(): Promise<Either<Array<AccessPlanObject>>> {
    return Either.left(new Error());
  }

  async getPolicies(): Promise<Either<Array<PolicyObject>>> {
    return Either.left(new Error());
  }
}
