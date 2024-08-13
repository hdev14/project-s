import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
import AccessPlan from "./AccessPlan";
import Policy from "./Policy";


export enum UserTypes {
  ADMIN = 'admin',
  COMPANY = 'company',
  EMPLOYEE = 'employee',
  CUSTOMER = 'customer'
}

export type UserObject = {
  id?: string;
  email: string;
  password: string;
  policies: Array<string>; // slugs
  access_plan_id?: string;
  tenant_id?: string;
  type: UserTypes;
}

export default class User extends Aggregate<UserObject> implements AggregateRoot {
  #email: string;
  #password: string;
  #policies: Array<string>;
  #access_plan_id?: string;
  #tenant_id?: string;
  #type: UserTypes;

  constructor(obj: UserObject) {
    super(obj.id);
    this.#email = obj.email;
    this.#password = obj.password;
    this.#policies = obj.policies;
    this.#access_plan_id = obj.access_plan_id;
    this.#tenant_id = obj.tenant_id;
    this.#type = obj.type;
  }

  set email(value: string) {
    this.#email = value;
  }

  set password(value: string) {
    this.#password = value;
  }

  attachPolicy(policy: Policy) {
    let has_policy = false;

    for (let idx = 0; idx < this.#policies.length; idx++) {
      has_policy = this.#policies[idx] === policy.toObject().slug;
      if (has_policy) break;
    }

    if (!has_policy) {
      this.#policies.push(policy.toObject().slug);
    }
  }

  dettachPolicy(policy: Policy) {
    const new_policy = [];

    for (let idx = 0; idx < this.#policies.length; idx++) {
      const p = this.#policies[idx];
      if (p !== policy.toObject().slug) {
        new_policy.push(p);
      }
    }

    this.#policies = new_policy;
  }

  changeAccessPlan(access_plan: AccessPlan) {
    this.#access_plan_id = access_plan.id;
  }

  toObject(): RequiredId<UserObject> {
    return {
      id: this.id,
      email: this.#email,
      password: this.#password,
      policies: this.#policies,
      access_plan_id: this.#access_plan_id,
      tenant_id: this.#tenant_id,
      type: this.#type,
    };
  }
}
