export default class CredentialError extends Error {
  constructor() {
    super('credential_error');
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, CredentialError.prototype);
  }
}