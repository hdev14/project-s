export default class CredentialError extends Error {
  constructor() {
    super('Credenciais inválidas');
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, CredentialError.prototype);
  }
}