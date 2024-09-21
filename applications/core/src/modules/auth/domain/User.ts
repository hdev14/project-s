import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";
import UserTypes from "@shared/UserTypes";
import AccessPlan from "./AccessPlan";
import Policy from "./Policy";

export type UserProps = AggregateProps<{
  email: string;
  password: string;
  policies: Array<string>; // slugs
  access_plan_id?: string;
  tenant_id?: string;
  type: UserTypes;
}>;

export default class User extends Aggregate<UserProps> implements AggregateRoot {
  #email: string;
  #password: string;
  #policies: Array<string>;
  #access_plan_id?: string;
  #tenant_id?: string;
  #type: UserTypes;

  constructor(props: UserProps) {
    super(props);
    this.#email = props.email;
    this.#password = props.password;
    this.#policies = props.policies;
    this.#access_plan_id = props.access_plan_id;
    this.#tenant_id = props.tenant_id;
    this.#type = props.type;
  }

  static fromObject(props: UserProps) {
    return new User(props);
  }

  set email(value: string) {
    this.#email = value;
    this.update();
  }

  set password(value: string) {
    this.#password = value;
    this.update();
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

    this.update();
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
    this.update();
  }

  changeAccessPlan(access_plan: AccessPlan) {
    this.#access_plan_id = access_plan.id;
    this.update();
  }

  toObject(): RequiredProps<UserProps> {
    return {
      id: this.id,
      email: this.#email,
      password: this.#password,
      policies: this.#policies,
      access_plan_id: this.#access_plan_id,
      tenant_id: this.#tenant_id,
      type: this.#type,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
