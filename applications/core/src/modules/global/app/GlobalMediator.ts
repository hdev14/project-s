
import Command from '@shared/Command';
import Handler from '@shared/Handler';
import Mediator from '@shared/Mediator';
import { injectable } from 'inversify';
import 'reflect-metadata';

@injectable()
export default class GlobalMediator implements Mediator {
  readonly #handlers: Map<string, Handler> = new Map<string, Handler>();

  get handlers() {
    return this.#handlers;
  }

  public register(command_name: string, handler: Handler) {
    if (!this.#handlers.has(command_name)) {
      this.#handlers.set(command_name, handler);
    }
  }

  public async send<R = void>(command: Command): Promise<R> {
    const handler = this.#handlers.get(command.name) as Handler<Command, R>;

    if (!handler) {
      throw new Error(`There is no command with this name: ${command.name}`);
    }

    return handler.handle(command);
  }
}
