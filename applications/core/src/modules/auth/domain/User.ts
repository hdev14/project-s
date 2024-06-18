import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
import AccessPlan from "./AccessPlan";
import Policy from "./Policy";


export type UserObject = {
  id?: string;
  email: string;
  password: string;
  policies: Array<string>; // slugs
  access_plan_id?: string;
}

export default class User extends Aggregate<UserObject> implements AggregateRoot {
  #email: string;
  #password: string;
  #policies: Array<string>;
  #access_plan_id?: string;

  constructor(obj: UserObject) {
    super(obj.id);
    this.#email = obj.email;
    this.#password = obj.password;
    this.#policies = obj.policies;
    this.#access_plan_id = obj.access_plan_id;
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
    }

    if (!has_policy) {
      this.#policies.push(policy.toObject().slug);
    }
  }

  dettachPolicy(policy: Policy) {
    const newPolicies = [];

    for (let idx = 0; idx < this.#policies.length; idx++) {
      const p = this.#policies[idx];
      if (p !== policy.toObject().slug) {
        newPolicies.push(p);
      }
    }

    this.#policies = newPolicies;
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
    }
  }
}