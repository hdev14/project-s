export default class DomainError extends Error {
  constructor(readonly aggregate: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}