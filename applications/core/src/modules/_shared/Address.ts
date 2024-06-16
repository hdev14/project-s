import ValueObject from "@shared/ddd/ValueObject";

export type AddressValue = {
  street: string;
  district: string;
  state: string;
  number: string;
  complement?: string;
};

export default class Address implements ValueObject<AddressValue> {
  constructor(
    readonly street: string,
    readonly district: string,
    readonly state: string,
    readonly number: string,
    readonly complement?: string,
  ) { }

  get value(): AddressValue {
    return this;
  }
}
