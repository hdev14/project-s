import ValueObject from "@share/ValueObject";

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

  value(): AddressValue {
    return this;
  }
}