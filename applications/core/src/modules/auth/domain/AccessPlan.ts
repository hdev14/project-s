import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";
import DomainError from "@shared/errors/DomainError";

export enum AccessPlanTypes {
  MONTHLY = 'monthly',
  ANNUALLY = 'annually'
}

export type AccessPlanProps = AggregateProps<{
  amount: number;
  type: AccessPlanTypes;
  description?: string;
  active: boolean;
}>;

export default class AccessPlan extends Aggregate<AccessPlanProps> implements AggregateRoot {
  #amount: number = 0;
  #type: AccessPlanTypes;
  #description?: string;
  #active: boolean;

  constructor(props: AccessPlanProps) {
    super(props);
    this.amount = props.amount;
    this.#type = props.type;
    this.#description = props.description;
    this.#active = props.active;
  }

  static fromObject(props: AccessPlanProps) {
    return new AccessPlan(props);
  }

  set amount(value: number) {
    if (value < 0) {
      throw new DomainError('negative_access_plan_amount');
    }
    this.#amount = value;
    this.update();
  }

  set description(value: string | undefined) {
    this.#description = value;
    this.update();
  }

  set type(value: AccessPlanTypes) {
    this.#type = value;
    this.update();
  }

  activate() {
    this.#active = true;
    this.update();
  }

  deactivate() {
    this.#active = false;
    this.update();
  }

  isActive() {
    return this.#active
  }

  toObject(): RequiredProps<AccessPlanProps> {
    return {
      id: this.id,
      amount: this.#amount,
      type: this.#type,
      description: this.#description,
      active: this.#active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
