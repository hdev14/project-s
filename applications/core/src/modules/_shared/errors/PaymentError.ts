export default class PaymentError extends Error {
  readonly payload?: Record<string, any>;

  constructor(message: string, payload?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.payload = payload;
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}
