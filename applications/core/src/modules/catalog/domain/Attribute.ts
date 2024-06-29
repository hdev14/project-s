import ValueObject from "@shared/ddd/ValueObject";

export type AttributeValue = {
  name: string;
  description: string;
};

export default class Attribute implements ValueObject<AttributeValue> {
  constructor(
    readonly name: string,
    readonly description: string
  ) { }

  get value(): AttributeValue {
    return this;
  }
}