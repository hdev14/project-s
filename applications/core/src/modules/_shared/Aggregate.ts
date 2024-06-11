import { randomUUID } from "crypto";

export default abstract class Aggregate<T = {}> {
  readonly id: string;

  constructor(id?: string) {
    this.id = id || randomUUID();
  }

  abstract toObject(): Required<T>;
}