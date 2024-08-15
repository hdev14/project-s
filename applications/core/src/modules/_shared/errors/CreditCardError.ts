export default class CreditCardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, CreditCardError.prototype);
  }
}
