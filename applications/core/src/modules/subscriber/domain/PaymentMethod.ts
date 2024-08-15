import ValueObject from "@shared/ddd/ValueObject";
import DomainError from "@shared/errors/DomainError";

export enum PaymentTypes {
  CREDIT_CARD = 'credit_card',
  PIX = 'pix',
  BOLETO = 'boleto'
}

export type PaymentMethodValue = {
  payment_type: PaymentTypes;
  credit_card_external_id?: string;
}

export default class PaymentMethod implements ValueObject<PaymentMethodValue> {
  constructor(
    readonly payment_type: PaymentTypes,
    readonly credit_card_external_id?: string
  ) {
    if (this.payment_type === PaymentTypes.CREDIT_CARD && !this.credit_card_external_id) {
      throw new DomainError('payment_method_credit_card');
    }
  }

  get value(): PaymentMethodValue {
    return this;
  }
}
