import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";

export type EmployeeObject = {
  id?: string;
  name: string;
  document: string;
  email: string;
  deactived_at?: Date;
};

export default class Employee extends Aggregate<EmployeeObject> {
  #name: string;
  #document: string;
  #email: string;
  #deactived_at?: Date;

  constructor(obj: EmployeeObject) {
    super(obj.id);
    this.#name = obj.name;
    this.#document = obj.document;
    this.#email = obj.email;
    this.#deactived_at = obj.deactived_at;
  }

  set name(value: string) {
    this.#name = value;
  }

  set email(value: string) {
    this.#email = value;
  }

  set document(value: string) {
    this.#document = value;
  }

  deactive() {
    this.#deactived_at = new Date();
  }

  toObject(): RequiredId<EmployeeObject> {
    return {
      id: this.id,
      name: this.#name,
      document: this.#document,
      email: this.#email,
      deactived_at: this.#deactived_at,
    };
  }
}