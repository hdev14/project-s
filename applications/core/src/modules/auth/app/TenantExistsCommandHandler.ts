import Handler from "@shared/Handler";
import TenantExistsCommand from "@shared/commands/TenantExistsCommand";
import types from "@shared/infra/types";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
import UserRepository from "./UserRepository";


@injectable()
export default class TenantExistsCommandHandler implements Handler<TenantExistsCommand, boolean> {
  #user_repository: UserRepository;

  constructor(@inject(types.UserRepository) user_repository: UserRepository) {
    this.#user_repository = user_repository;
  }

  async handle(command: TenantExistsCommand): Promise<boolean> {
    const tenant = await this.#user_repository.getUserById(command.tenant_id);
    return !!tenant;
  }
}