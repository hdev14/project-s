import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";


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