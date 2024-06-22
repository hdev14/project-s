import { Pool } from 'pg';

export default class Database {
  static #instance: Pool | null = null;

  private constructor() {
    Database.#instance = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  static connect() {
    if (Database.#instance === null) {
      new Database();
    }

    return Database.#instance!;
  }

  static async disconnect() {
    if (Database.#instance) {
      Database.#instance.end();
      Database.#instance = null;
    }
  }
}