export default class AlreadyRegisteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AlreadyRegisteredError.prototype);
  }
}