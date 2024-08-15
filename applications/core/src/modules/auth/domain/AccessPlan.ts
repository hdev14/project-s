import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
import DomainError from "@shared/errors/DomainError";

export enum AccessPlanTypes {
  MONTHLY = 'monthly',
  ANNUALLY = 'annually'
}

export type AccessPlanObject = {
  id?: string;
  amount: number;
  type: AccessPlanTypes;
  description?: string;
  active: boolean;
};

export default class AccessPlan extends Aggregate<AccessPlanObject> implements AggregateRoot {
  #amount: number = 0;
  #type: AccessPlanTypes;
  #description?: string;
  #active: boolean;

  constructor(obj: AccessPlanObject) {
    super(obj.id);
    this.amount = obj.amount;
    this.#type = obj.type;
    this.#description = obj.description;
    this.#active = obj.active;
  }

  set amount(value: number) {
    if (value < 0) {
      throw new DomainError('negative_access_plan_amount');
    }
    this.#amount = value;
  }

  set description(value: string | undefined) {
    this.#description = value;
  }

  set type(value: AccessPlanTypes) {
    this.#type = value;
  }

  activate() {
    this.#active = true;
  }

  deactivate() {
    this.#active = false;
  }

  isActive() {
    return this.#active
  }

  toObject(): RequiredId<AccessPlanObject> {
    return {
      id: this.id,
      amount: this.#amount,
      type: this.#type,
      description: this.#description,
      active: this.#active,
    };
  }
}
