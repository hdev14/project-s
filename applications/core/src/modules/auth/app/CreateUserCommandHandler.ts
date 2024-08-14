import User from "@auth/domain/User";
import Handler from "@shared/Handler";
import CreateUserCommand from "@shared/commands/CreateUserCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import { injectable } from "inversify";
import 'reflect-metadata';
import AccessPlanRepository from "./AccessPlanRepository";
import Encryptor from "./Encryptor";
import UserRepository from "./UserRepository";

@injectable()
export default class CreateUserCommandHandler implements Handler<CreateUserCommand, string> {
  #user_repository: UserRepository;
  #encryptor: Encryptor;
  #access_plan_repository: AccessPlanRepository;

  constructor(
    user_repository: UserRepository,
    encryptor: Encryptor,
    access_plan_repository: AccessPlanRepository,
  ) {
    this.#user_repository = user_repository;
    this.#encryptor = encryptor;
    this.#access_plan_repository = access_plan_repository;
  }

  async handle(command: CreateUserCommand): Promise<string> {
    if (command.access_plan_id) {
      const access_plan = await this.#access_plan_repository.getAccessPlanById(command.access_plan_id);

      if (!access_plan) {
        throw new NotFoundError('notfound.access_plan');
      }
    }

    const user = new User({
      email: command.email,
      password: this.#encryptor.createHash(command.temp_password),
      policies: command.default_policies,
      access_plan_id: command.access_plan_id,
      tenant_id: command.tenant_id,
      type: command.type as UserTypes
    });

    await this.#user_repository.createUser(user);

    return user.id;
  }
}
