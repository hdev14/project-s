import Command from "./Command";

export default interface Handler<C = Command, R = unknown> {
  handle(command: C): Promise<R>;
}