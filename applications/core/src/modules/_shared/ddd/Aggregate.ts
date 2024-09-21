import { randomUUID } from "crypto";

export interface AggregateRoot { }

export type AggregateProps<T = object> = T & {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type RequiredProps<T extends AggregateProps> = Required<Pick<T, 'id' | 'created_at' | 'updated_at'>> & Omit<T, 'id' | 'created_at' | 'updated_at'>;

export default abstract class Aggregate<T extends AggregateProps> {
  readonly #id: string;
  readonly #created_at: Date;
  #updated_at: Date;

  constructor(props: AggregateProps) {
    this.#id = props.id || randomUUID();
    this.#created_at = props.created_at || new Date();
    this.#updated_at = props.updated_at || new Date();
  }

  get id() {
    return this.#id;
  }

  get created_at() {
    return this.#created_at;
  }

  get updated_at() {
    return this.#updated_at;
  }

  protected update() {
    this.#updated_at = new Date();
  }

  abstract toObject(): RequiredProps<T>;
}
