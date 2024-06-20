export default class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}