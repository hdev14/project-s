import { randomUUID } from "crypto";

export interface AggregateRoot { }

export type RequiredId<T extends { id?: string }> = Required<Pick<T, 'id'>> & Omit<T, 'id'>;

export default abstract class Aggregate<T extends { id?: string }> {
  readonly id: string;

  constructor(id?: string) {
    this.id = id || randomUUID();
  }

  abstract toObject(): RequiredId<T>;
}
