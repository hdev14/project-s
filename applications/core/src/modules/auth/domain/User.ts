import Aggregate from "@share/Aggregate";
import AggregateRoot from "@share/AggregateRoot";
import Policy, { PolicyObject } from "./Policy";


export type UserObject = {
  id?: string;
  email: string;
  password: string;
  policies: Array<PolicyObject>;
}

export default class User extends Aggregate<UserObject> implements AggregateRoot {
  #email: string;
  #password: string;
  #policies: Array<Policy> = [];

  constructor(obj: UserObject) {
    super(obj.id);
    this.#email = obj.email;
    this.#password = obj.password;

    for (let idx = 0; idx < obj.policies.length; idx++) {
      const policy = obj.policies[idx];
      this.#policies.push(new Policy(policy))
    }
  }

  toObject(): Required<UserObject> {
    return {
      id: this.id,
      email: this.#email,
      password: this.#password,
      policies: this.#policies.map((policy) => policy.toObject())
    }
  }
}