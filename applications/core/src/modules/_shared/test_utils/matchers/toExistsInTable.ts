import { expect } from '@jest/globals';
import DbUtils from '@shared/utils/DbUtils';
import type { MatcherFunction } from 'expect';

const toExistsInTable: MatcherFunction<[table: string]> =
  async function (payload, table) {
    if (!(typeof table === 'string' || typeof payload === 'object')) {
      throw new TypeError('Params are not valid');
    }

    const result = await globalThis.db.query(
      `SELECT * FROM ${table} WHERE ${DbUtils.andOperator(payload as object)}`,
      DbUtils.sanitizeValues(Object.values(payload as object))
    );

    if (result.rowCount && result.rowCount >= 0) {
      return {
        message: () => `The table ${this.utils.printReceived(table)} has the item with this fields ${this.utils.printExpected(payload)}`,
        pass: true,
      };
    }

    return {
      message: () => `The table ${this.utils.printReceived(table)} doesn't have any item with this fields ${this.utils.printExpected(payload)}`,
      pass: false,
    };
  };

expect.extend({
  toExistsInTable,
});
