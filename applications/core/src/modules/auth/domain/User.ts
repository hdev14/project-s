import Aggregate, { AggregateRoot, RequiredId } from "@share/ddd/Aggregate";
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
      this.#policies.push(new Policy(obj.policies[idx]))
    }
  }

  toObject(): RequiredId<UserObject> {
    const policies = [];

    for (let idx = 0; idx < this.#policies.length; idx++) {
      policies.push(this.#policies[idx].toObject())
    }

    return {
      id: this.id,
      email: this.#email,
      password: this.#password,
      policies
    }
  }
}