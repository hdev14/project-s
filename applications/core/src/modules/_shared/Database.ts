import { Pool } from 'pg';

export default class Database {
  static #instance: Pool;

  private constructor() {
    Database.#instance = new Pool({
      database: process.env.DATABASE,
      password: process.env.DATABASE_PASSWORD,
      user: process.env.DATABASE_USER,
      host: process.env.DATABASE_HOST,
    });
  }

  static connect() {
    if (Database.#instance === undefined) {
      new Database();
    }

    return Database.#instance;
  }
}