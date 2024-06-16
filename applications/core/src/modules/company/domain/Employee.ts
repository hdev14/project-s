import Aggregate, { RequiredId } from "@share/ddd/Aggregate";

export type EmployeeObject = {
  id?: string;
  name: string;
  document: string;
  email: string;
};

export default class Employee extends Aggregate<EmployeeObject> {
  #name: string;
  #document: string;
  #email: string;

  constructor(obj: EmployeeObject) {
    super(obj.id);
    this.#name = obj.name;
    this.#document = obj.document;
    this.#email = obj.email;
  }

  toObject(): RequiredId<EmployeeObject> {
    return {
      id: this.id,
      name: this.#name,
      document: this.#document,
      email: this.#email
    };
  }
}