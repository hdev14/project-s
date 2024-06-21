import Encryptor from "@auth/app/Encryptor";
import bcrypt from 'bcrypt';
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class BcryptEncryptor implements Encryptor {
  private readonly SALT = 10;

  createHash(value: string): string {
    return bcrypt.hashSync(value, this.SALT);
  }

  compareHash(value: string, hash: string): boolean {
    return bcrypt.compareSync(value, hash);
  }
}