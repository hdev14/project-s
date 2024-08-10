import { expect } from '@jest/globals';
import type { MatcherFunction } from 'expect';

const toEqualInDatabase: MatcherFunction<[table: string, id: string]> =
  async function (expected, table, id) {
    if (!(typeof table === 'string' || typeof id === 'string' || typeof expected === 'object')) {
      throw new TypeError('Params are not valid');
    }

    const payload = expected as Record<string, any>;

    const result = await globalThis.db.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);

    if (result.rowCount && result.rowCount >= 0) {
      const item = result.rows[0];

      const item_keys = Object.keys(item);
      const payload_keys = Object.keys(payload as object);

      for (let idx = 0; idx < payload_keys.length; idx++) {
        const payload_key = payload_keys[idx];
        if (!item_keys.includes(payload_key)) {
          return {
            message: () => `The item ${this.utils.printReceived(item)} doesn't have the field ${this.utils.printExpected(payload_key)}`,
            pass: false,
          };
        }

        if (!this.equals(item[payload_key], payload[payload_key])) {
          return {
            message: () => `The item ${this.utils.printReceived(item)} is not equal to ${this.utils.printExpected(payload)}`,
            pass: false,
          };
        }
      }

      return {
        message: () => `The item ${this.utils.printReceived(table)} is equal to ${this.utils.printExpected(payload)}`,
        pass: true,
      };
    }

    return {
      message: () => `The table ${this.utils.printReceived(table)} doesn't have any item with this id ${this.utils.printExpected(id)}`,
      pass: false,
    };
  };

expect.extend({
  toEqualInDatabase,
});
