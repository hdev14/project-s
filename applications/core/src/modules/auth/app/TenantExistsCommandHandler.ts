import Handler from "@shared/Handler";
import TenantExistsCommand from "@shared/TenantExistsCommand";
import UserRepository from "./UserRepository";

export default class TenantExistsCommandHandler implements Handler<TenantExistsCommand, boolean> {
  #user_repository: UserRepository;

  constructor(user_repository: UserRepository) {
    this.#user_repository = user_repository;
  }

  async handle(command: TenantExistsCommand): Promise<boolean> {
    const tenant = await this.#user_repository.getUserById(command.tenant_id);
    return !!tenant;
  }
}