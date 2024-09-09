
import Command from '@shared/Command';
import Handler from '@shared/Handler';

export default interface Mediator {
  get handlers(): Map<string, Handler>;
  register(command_name: string, handler: Handler): void;
  send<R = void>(command: Command): Promise<R>;
}
