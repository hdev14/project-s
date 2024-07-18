import Aggregate, { RequiredId } from "@shared/ddd/Aggregate";

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
  #is_new = false;
  #has_updates = false;

  constructor(obj: EmployeeObject) {
    super(obj.id);
    this.#name = obj.name;
    this.#document = obj.document;
    this.#email = obj.email;
  }

  // TODO
  static new(obj: EmployeeObject) {
    const employee = new Employee(obj);
    employee.isNew = true;
    return employee;
  }

  set name(value: string) {
    this.#name = value;
    this.hasUpdates = true;
  }

  set email(value: string) {
    this.#email = value;
    this.hasUpdates = true;
  }

  set document(value: string) {
    this.#document = value;
    this.hasUpdates = true;
  }

  get isNew() {
    return this.#is_new;
  }

  get hasUpdates() {
    return this.#has_updates;
  }

  private set isNew(value: boolean) {
    this.#is_new = value;
  }

  private set hasUpdates(value: boolean) {
    this.#has_updates = value;
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