import ValueObject from "@shared/ddd/ValueObject";

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
  ) { }

  get value(): PaymentMethodValue {
    return this;
  }
}
