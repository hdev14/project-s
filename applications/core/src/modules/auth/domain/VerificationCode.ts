import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";

export type VerificationCodeProps = AggregateProps<{
  code: string;
  user_id: string;
  expired_at: Date;
}>;

export default class VerificationCode extends Aggregate<VerificationCodeProps> implements AggregateRoot {
  #code: string;
  #user_id: string;
  #expired_at: Date;

  constructor(props: VerificationCodeProps) {
    super(props);
    this.#code = props.code;
    this.#user_id = props.user_id;
    this.#expired_at = props.expired_at;
  }

  static fromObject(props: VerificationCodeProps) {
    return new VerificationCode(props);
  }

  get code() {
    return this.#code
  }

  get user_id() {
    return this.#user_id
  }

  expire() {
    this.#expired_at = new Date();
    this.update();
  }

  isExpired() {
    return this.#expired_at < new Date();
  }

  toObject(): RequiredProps<VerificationCodeProps> {
    return {
      id: this.id,
      code: this.#code,
      user_id: this.#user_id,
      expired_at: this.#expired_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
