import ValueObject from "@share/ddd/ValueObject";

export type AddressValue = {
  state: string;
  street: string;
  neighborhood: string;
  complement?: string;
  number: string;
}

export default class Address implements ValueObject<AddressValue> {
  constructor(
    readonly state: string,
    readonly street: string,
    readonly neighborhood: string,
    readonly number: string,
    readonly complement?: string,
  ) { }

  get value(): AddressValue {
    return this;
  }
}