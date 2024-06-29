import ValueObject from "@shared/ddd/ValueObject";

export type BrandValue = {
  color: string;
  logo_url?: string;
};

export default class Brand implements ValueObject<BrandValue> {
  constructor(
    readonly color: string,
    readonly logo_url?: string,
  ) { }

  get description(): BrandValue {
    return this;
  }
}