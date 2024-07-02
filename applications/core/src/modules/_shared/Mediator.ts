
import Command from "./Command";
import Handler from "./Handler";

export default class Mediator {
  private readonly _handlers: Map<string, Handler> = new Map<string, Handler>();

  get handlers() {
    return this._handlers;
  }

  public register(command_name: string, handler: Handler) {
    if (!this._handlers.has(command_name)) {
      this._handlers.set(command_name, handler);
    }
  }

  public async send<R = any>(command: Command): Promise<void | R> {
    const handler = this._handlers.get(command.name) as Handler<Command, R>;

    if (!handler) {
      throw new Error(`There is no command with this name: ${command.name}`);
    }

    return handler.handle(command);
  }
}