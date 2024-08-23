export default class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}
