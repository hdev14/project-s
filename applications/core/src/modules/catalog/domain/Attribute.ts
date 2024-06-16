import ValueObject from "@shared/ddd/ValueObject";

export type AttributeValue = {
  att_name: string;
  att_value: string;
};

export default class Attribute implements ValueObject<AttributeValue> {
  constructor(
    readonly att_name: string,
    readonly att_value: string
  ) { }

  get value(): AttributeValue {
    return this;
  }
}