import AccessPlan, { AccessPlanObject, AccessPlanTypes } from "@auth/domain/AccessPlan";
import Policy, { PolicyObject } from "@auth/domain/Policy";
import User, { UserObject } from "@auth/domain/User";
import VerificationCode from "@auth/domain/VerificationCode";
import CredentialError from "@shared/errors/CredentialError";
import DomainError from "@shared/errors/DomainError";
import ExpiredCodeError from "@shared/errors/ExpiredCode";
import NotFoundError from "@shared/errors/NotFoundError";
import types from "@shared/types";
import UserTypes from "@shared/UserTypes";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import { randomInt } from "crypto";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
import EmailService from "../../global/app/EmailService";
import AccessPlanRepository from "./AccessPlanRepository";
import AuthTokenManager, { TokenResult } from "./AuthTokenManager";
import Encryptor from "./Encryptor";
import PolicyRepository from "./PolicyRepository";
import UserRepository from "./UserRepository";
import VerificationCodeRepository from "./VerificationCodeRepository";

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
  type: UserTypes;
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

export type ChangeAccessPlanParams = {
  user_id: string;
  access_plan_id: string;
};

export type CreateAccessPlanParams = {
  amount: number;
  type: AccessPlanTypes;
  description?: string;
};

export type UpdateAccessPlanParams = Partial<CreateAccessPlanParams> & {
  access_plan_id: string;
  active?: boolean;
};

export type ForgotPasswordParams = {
  email: string;
};

export type ResetPasswordParams = {
  code: string;
  password: string;
};

@injectable()
export default class AuthService {
  #encryptor: Encryptor;
  #auth_token_manager: AuthTokenManager;
  #user_repository: UserRepository;
  #policy_repository: PolicyRepository;
  #access_plan_repository: AccessPlanRepository;
  #verification_code_repository: VerificationCodeRepository;
  #email_service: EmailService;

  constructor(
    @inject(types.Encryptor) encryptor: Encryptor,
    @inject(types.AuthTokenManager) auth_token_manager: AuthTokenManager,
    @inject(types.UserRepository) user_repository: UserRepository,
    @inject(types.PolicyRepository) policy_repository: PolicyRepository,
    @inject(types.AccessPlanRepository) access_plan_repository: AccessPlanRepository,
    @inject(types.VerificationCodeRepository) verification_code_repository: VerificationCodeRepository,
    @inject(types.EmailService) email_service: EmailService,
  ) {
    this.#encryptor = encryptor;
    this.#auth_token_manager = auth_token_manager;
    this.#user_repository = user_repository;
    this.#policy_repository = policy_repository;
    this.#access_plan_repository = access_plan_repository;
    this.#verification_code_repository = verification_code_repository;
    this.#email_service = email_service;
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
        return Either.left(new NotFoundError('notfound.access_plan'));
      }
      if (!access_plan.isActive()) {
        return Either.left(new Error('deactivate_access_plan'));
      }
    }

    if (params.tenant_id !== undefined) {
      const tenant = await this.#user_repository.getUserById(params.tenant_id);
      if (!tenant) {
        return Either.left(new NotFoundError('notfound.company'));
      }
    }

    const user = new User({
      email: params.email,
      password: this.#encryptor.createHash(params.password),
      policies: [],
      access_plan_id: params.access_plan_id,
      tenant_id: params.tenant_id,
      type: params.type,
    });

    await this.#user_repository.createUser(user);

    return Either.right(user.toObject());
  }

  async updateUser(params: UpdateUserParams): Promise<Either<void>> {
    const user = await this.#user_repository.getUserById(params.user_id);

    if (!user) {
      return Either.left(new NotFoundError('notfound.user'));
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
      return Either.left(new NotFoundError('notfound.user'));
    }

    const policies = await this.#policy_repository.getPolicies({
      slugs: params.policy_slugs,
    });

    if (params.mode === 'attach') {
      for (let idx = 0; idx < policies.length; idx++) {
        user.attachPolicy(new Policy(policies[idx]));
      }
    }

    if (params.mode === 'dettach') {
      for (let idx = 0; idx < policies.length; idx++) {
        user.dettachPolicy(new Policy(policies[idx]));
      }
    }

    await this.#user_repository.updateUser(user);

    return Either.right();
  }

  async getUsers(params: GetUsersParams): Promise<Either<GetUsersResult>> {
    return Either.right(await this.#user_repository.getUsers(params));
  }

  async changeAccessPlan(params: ChangeAccessPlanParams): Promise<Either<void>> {
    const access_plan = await this.#access_plan_repository.getAccessPlanById(params.access_plan_id);

    if (!access_plan) {
      return Either.left(new NotFoundError('notfound.access_plan'));
    }

    const user = await this.#user_repository.getUserById(params.user_id);

    if (!user) {
      return Either.left(new NotFoundError('notfound.user'));
    }

    user.changeAccessPlan(access_plan);

    await this.#user_repository.updateUser(user);

    return Either.right();
  }

  async createAccessPlan(params: CreateAccessPlanParams): Promise<Either<AccessPlanObject>> {
    try {
      const access_plan = new AccessPlan({
        active: false,
        amount: params.amount,
        type: params.type,
        description: params.description
      });

      await this.#access_plan_repository.createAccessPlan(access_plan);

      return Either.right(access_plan.toObject());
    } catch (error) {
      if (error instanceof DomainError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async updateAccessPlan(params: UpdateAccessPlanParams): Promise<Either<void>> {
    try {
      const access_plan = await this.#access_plan_repository.getAccessPlanById(params.access_plan_id);

      if (!access_plan) {
        return Either.left(new NotFoundError('notfound.access_plan'));
      }

      if (params.active !== undefined) {
        if (params.active && !access_plan.isActive()) {
          access_plan.activate();
        }

        if (!params.active && access_plan.isActive()) {
          access_plan.deactivate();
        }
      }

      const obj = access_plan.toObject();

      access_plan.amount = params.amount ?? obj.amount;
      access_plan.description = params.description ?? obj.description;
      access_plan.type = params.type ?? obj.type;

      await this.#access_plan_repository.updateAccessPlan(access_plan);
      return Either.right();
    } catch (error) {
      if (error instanceof DomainError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async getAccessPlans(): Promise<Either<Array<AccessPlanObject>>> {
    const access_plans = await this.#access_plan_repository.getAccessPlans();
    return Either.right(access_plans);
  }

  async getPolicies(): Promise<Either<Array<PolicyObject>>> {
    const policies = await this.#policy_repository.getPolicies();
    return Either.right(policies);
  }

  async forgotPassword(params: ForgotPasswordParams): Promise<Either<void>> {
    const user = await this.#user_repository.getUserByEmail(params.email);

    if (!user) {
      return Either.left(new NotFoundError('notfound.user'));
    }

    const expired_at = new Date();
    expired_at.setMinutes(expired_at.getMinutes() + 1);

    const code = `${randomInt(1, 9)}${randomInt(1, 9)}${randomInt(1, 9)}${randomInt(1, 9)}`;

    const user_obj = user.toObject();

    const verification_code = new VerificationCode({
      code,
      user_id: user_obj.id,
      expired_at,
    });

    await this.#verification_code_repository.createVerificationCode(verification_code);

    await this.#email_service.send({
      email: user_obj.email,
      message: `Este é o código de verificação para redefinição de senha: ${code}`,
      title: 'Código de redefinição de senha'
    });

    return Either.right();
  }

  async resetPassword(params: ResetPasswordParams): Promise<Either<void>> {
    const verification_code = await this.#verification_code_repository.getVerificationCodeByCode(params.code);

    if (!verification_code) {
      return Either.left(new NotFoundError('notfound.code'));
    }

    if (verification_code.isExpired()) {
      return Either.left(new ExpiredCodeError());
    }

    const user = await this.#user_repository.getUserById(verification_code.user_id);

    if (user) {
      user.password = this.#encryptor.createHash(params.password);
      await this.#user_repository.updateUser(user);
    }

    return Either.right();
  }
}
