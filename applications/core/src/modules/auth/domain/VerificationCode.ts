import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";

export type VerificationCodeObject = {
  id?: string;
  code: string;
  user_id: string;
  expired_at: Date;
};

export default class VerificationCode extends Aggregate<VerificationCodeObject> implements AggregateRoot {
  #code: string;
  #user_id: string;
  #expired_at: Date;

  constructor(obj: VerificationCodeObject) {
    super(obj.id);
    this.#code = obj.code;
    this.#user_id = obj.user_id;
    this.#expired_at = obj.expired_at;
  }

  expire() {
    this.#expired_at = new Date();
  }

  toObject(): RequiredId<VerificationCodeObject> {
    return {
      id: this.id,
      code: this.#code,
      user_id: this.#user_id,
      expired_at: this.#expired_at
    };
  }
}