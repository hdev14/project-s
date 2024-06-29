import ValueObject from "@shared/ddd/ValueObject";

export type BankValue = {
  account: string;
  account_digit: string;
  agency: string;
  agency_digit: string;
  bank_code: string;
};

export default class Bank implements ValueObject<BankValue> {
  constructor(
    readonly account: string,
    readonly account_digit: string,
    readonly agency: string,
    readonly agency_digit: string,
    readonly bank_code: string,
  ) { }

  get description(): BankValue {
    return this;
  }
}
