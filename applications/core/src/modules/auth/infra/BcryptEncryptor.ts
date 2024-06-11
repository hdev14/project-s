import Encryptor from "@auth/app/Encryptor";

export default class BcryptEncryptor implements Encryptor {
  createHash(value: string): string {
    throw new Error("Method not implemented.");
  }
  compareHash(value: string, hash: string): boolean {
    throw new Error("Method not implemented.");
  }
}