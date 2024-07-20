export default class ExpiredCodeError extends Error {
  constructor() {
    super('expired_code');
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, ExpiredCodeError.prototype);
  }
}