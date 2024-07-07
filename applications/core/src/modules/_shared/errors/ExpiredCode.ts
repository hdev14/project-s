export default class ExpiredCodeError extends Error {
  constructor(code: string) {
    super(`O código ${code} está expirado`);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, ExpiredCodeError.prototype);
  }
}