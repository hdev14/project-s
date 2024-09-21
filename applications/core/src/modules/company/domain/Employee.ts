import Aggregate, { AggregateProps, RequiredProps } from "@shared/ddd/Aggregate";

export type EmployeeProps = AggregateProps & {
  name: string;
  document: string;
  email: string;
  deactivated_at?: Date;
};

export default class Employee extends Aggregate<EmployeeProps> {
  #name: string;
  #document: string;
  #email: string;
  #deactivated_at?: Date;

  constructor(props: EmployeeProps) {
    super(props);
    this.#name = props.name;
    this.#document = props.document;
    this.#email = props.email;
    this.#deactivated_at = props.deactivated_at;
  }

  static fromObject(props: EmployeeProps) {
    return new Employee(props);
  }

  set name(value: string) {
    this.#name = value;
    this.update();
  }

  set email(value: string) {
    this.#email = value;
    this.update();
  }

  set document(value: string) {
    this.#document = value;
    this.update();
  }

  deactive() {
    this.#deactivated_at = new Date();
    this.update();
  }

  toObject(): RequiredProps<EmployeeProps> {
    return {
      id: this.id,
      name: this.#name,
      document: this.#document,
      email: this.#email,
      deactivated_at: this.#deactivated_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
