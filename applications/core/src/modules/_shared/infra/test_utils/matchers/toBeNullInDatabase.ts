import { expect } from '@jest/globals';
import type { MatcherFunction } from 'expect';

const toBeNullInDatabase: MatcherFunction<[table: string, id: string]> =
  async function (column, table, id) {
    if (!(typeof table === 'string' || typeof column === 'string' || typeof id === 'string')) {
      throw new TypeError('Params are not valid');
    }

    const result = await globalThis.db.query(
      `SELECT ${column} FROM ${table} WHERE id = $1`,
      [id]
    );

    if (!result.rowCount || result.rowCount == 0) {
      return {
        message: () => `The column ${this.utils.printExpected(column)} was not found with this params ${this.utils.printReceived({ table, id })}`,
        pass: false,
      };
    }

    if (result.rows[0] && (result.rows[0][column as string] === null || result.rows[0][column as string] === undefined)) {
      return {
        message: () => `The column ${this.utils.printExpected(column)} is null`,
        pass: true,
      };
    }

    return {
      message: () => `The column ${this.utils.printExpected(column)} is not null`,
      pass: false,
    };
  };

expect.extend({
  toBeNullInDatabase,
});
