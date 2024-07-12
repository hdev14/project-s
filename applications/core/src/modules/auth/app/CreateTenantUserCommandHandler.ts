import User from "@auth/domain/User";
import Handler from "@shared/Handler";
import CreateTenantUserCommand from "@shared/commands/CreateTenantUserCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import { injectable } from "inversify";
import 'reflect-metadata';
import AccessPlanRepository from "./AccessPlanRepository";
import EmailService from "./EmailService";
import Encryptor from "./Encryptor";
import UserRepository from "./UserRepository";


@injectable()
export default class CreateTenantUserCommandHandler implements Handler<CreateTenantUserCommand, string> {
  #user_repository: UserRepository;
  #email_service: EmailService;
  #encryptor: Encryptor;
  #access_plan_repository: AccessPlanRepository;

  constructor(
    user_repository: UserRepository,
    email_service: EmailService,
    encryptor: Encryptor,
    access_plan_repository: AccessPlanRepository,
  ) {
    this.#user_repository = user_repository;
    this.#email_service = email_service;
    this.#encryptor = encryptor;
    this.#access_plan_repository = access_plan_repository;
  }

  async handle(command: CreateTenantUserCommand): Promise<string> {
    const access_plan = await this.#access_plan_repository.getAccessPlanById(command.access_plan_id);

    if (!access_plan) {
      throw new NotFoundError('Plano de acesso não encontrado');
    }

    const user = new User({
      email: command.email,
      password: this.#encryptor.createHash(command.temp_password),
      policies: command.default_policies,
      access_plan_id: command.access_plan_id,
    });

    await this.#user_repository.createUser(user);

    return user.id;
  }
}