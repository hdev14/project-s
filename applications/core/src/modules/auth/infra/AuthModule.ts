import AccessPlanRepository from "@auth/app/AccessPlanRepository";
import AuthService from "@auth/app/AuthService";
import AuthTokenManager from "@auth/app/AuthTokenManager";
import CreateTenantUserCommandHandler from "@auth/app/CreateTenantUserCommandHandler";
import Encryptor from "@auth/app/Encryptor";
import PolicyRepository from "@auth/app/PolicyRepository";
import TenantExistsCommandHandler from "@auth/app/TenantExistsCommandHandler";
import UserRepository from "@auth/app/UserRepository";
import VerificationCodeRepository from "@auth/app/VerificationCodeRepository";
import Mediator from "@shared/Mediator";
import CreateTenantUserCommand from "@shared/commands/CreateTenantUserCommand";
import UserExistsCommand from "@shared/commands/TenantExistsCommand";
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
import DbVerificationCodeRepository from "./persistence/DbVerificationCodeRepository";

export default class AuthModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind, _unbind, _isBound, _rebind, _unbindAsync, onActivation) => {
      const user_repository = new DbUserRepository();
      const encryptor = new BcryptEncryptor();
      const access_plan_repository = new DbAccessPlanRepository();
      bind<AccessPlanRepository>(types.AccessPlanRepository).toConstantValue(access_plan_repository);
      bind<PolicyRepository>(types.PolicyRepository).to(DbPolicyRepository).inSingletonScope();
      bind<UserRepository>(types.UserRepository).toConstantValue(user_repository);
      bind<AuthTokenManager>(types.AuthTokenManager).to(JWTManager).inSingletonScope();
      bind<Encryptor>(types.Encryptor).toConstantValue(encryptor);
      bind<AuthService>(types.AuthService).to(AuthService).inSingletonScope();
      bind<AuthMiddleware>(types.AuthMiddleware).to(AuthMiddleware).inRequestScope();
      bind<VerificationCodeRepository>(types.VerificationCodeRepository).to(DbVerificationCodeRepository).inSingletonScope();
      onActivation<Mediator>(types.Mediator, (_context, mediator) => {
        mediator.register(
          UserExistsCommand.name,
          new TenantExistsCommandHandler(user_repository),
        );
        mediator.register(
          CreateTenantUserCommand.name,
          new CreateTenantUserCommandHandler(user_repository, encryptor, access_plan_repository)
        )
        return mediator;
      })
    });

    return module;
  }
}