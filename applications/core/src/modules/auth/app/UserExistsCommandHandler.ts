import UserExistsCommand from "@shared/commands/UserExistsCommand";
import Handler from "@shared/Handler";
import types from "@shared/infra/types";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
import UserRepository from "./UserRepository";


@injectable()
export default class UserExistsCommandHandler implements Handler<UserExistsCommand, boolean> {
  #user_repository: UserRepository;

  constructor(@inject(types.UserRepository) user_repository: UserRepository) {
    this.#user_repository = user_repository;
  }

  async handle(command: UserExistsCommand): Promise<boolean> {
    const tenant = await this.#user_repository.getUserById(command.user_id);
    return !!tenant;
  }
}