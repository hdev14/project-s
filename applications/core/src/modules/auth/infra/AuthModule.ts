import AccessPlanRepository from "@auth/app/AccessPlanRepository";
import AuthService from "@auth/app/AuthService";
import AuthTokenManager from "@auth/app/AuthTokenManager";
import Encryptor from "@auth/app/Encryptor";
import PolicyRepository from "@auth/app/PolicyRepository";
import UserRepository from "@auth/app/UserRepository";
import AuthMiddleware from "@shared/infra/AuthMiddleware";
import Module from "@shared/infra/Module";
import types from "@shared/infra/types";
import { ContainerModule } from "inversify";
import BcryptEncryptor from "./auth/BcryptEncryptor";
import JWTManager from "./auth/JWTManager";
import './http/AuthController';
import DbAccessPlanRepository from "./persistence/DbAccessPlanRepository";
import DbPolicyRepository from "./persistence/DbPolicyRepository";
import DbUserRepository from "./persistence/DbUserRepository";

export default class AuthModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind) => {
      bind<AccessPlanRepository>(types.AccessPlanRepository).to(DbAccessPlanRepository).inSingletonScope();
      bind<PolicyRepository>(types.PolicyRepository).to(DbPolicyRepository).inSingletonScope();
      bind<UserRepository>(types.UserRepository).to(DbUserRepository).inSingletonScope();
      bind<AuthTokenManager>(types.AuthTokenManager).to(JWTManager).inSingletonScope();
      bind<Encryptor>(types.Encryptor).to(BcryptEncryptor).inSingletonScope();
      bind<AuthService>(types.AuthService).to(AuthService).inSingletonScope();
      bind<AuthMiddleware>(types.AuthMiddleware).to(AuthMiddleware);
    });

    return module;
  }
}