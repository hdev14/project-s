export default interface Encryptor {
  createHash(value: string): string;
  compareHash(value: string, hash: string): boolean;
}