import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";

export type EmployeeObject = {
  id?: string;
  name: string;
  document: string;
  email: string;
  deactivated_at?: Date;
};

export default class Employee extends Aggregate<EmployeeObject> {
  #name: string;
  #document: string;
  #email: string;
  #deactivated_at?: Date;

  constructor(obj: EmployeeObject) {
    super(obj.id);
    this.#name = obj.name;
    this.#document = obj.document;
    this.#email = obj.email;
    this.#deactivated_at = obj.deactivated_at;
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
    this.#deactivated_at = new Date();
  }

  toObject(): RequiredId<EmployeeObject> {
    return {
      id: this.id,
      name: this.#name,
      document: this.#document,
      email: this.#email,
      deactivated_at: this.#deactivated_at,
    };
  }
}