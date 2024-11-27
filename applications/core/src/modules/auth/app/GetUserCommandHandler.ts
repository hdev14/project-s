import GetUserCommand from "@shared/commands/GetUserCommand";
import Handler from "@shared/Handler";
import types from "@shared/types";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
import UserRepository from "./UserRepository";

@injectable()
export default class GetUserCommandHandler implements Handler<GetUserCommand, any> {
  #user_repository: UserRepository;

  constructor(@inject(types.UserRepository) user_repository: UserRepository) {
    this.#user_repository = user_repository;
  }

  async handle(command: GetUserCommand): Promise<any> {
    const user = await this.#user_repository.getUserById(command.user_id);
    return user ? user.toObject() : null;
  }
}
