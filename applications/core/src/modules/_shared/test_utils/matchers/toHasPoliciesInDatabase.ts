import { expect } from '@jest/globals';
import type { MatcherFunction } from 'expect';

const toHasPoliciesInDatabase: MatcherFunction<[]> =
  async function (user_id) {
    if (!(typeof user_id === 'string')) {
      throw new TypeError('Params are not valid');
    }

    const result = await globalThis.db.query(
      'SELECT id FROM user_policies JOIN policies ON policy_id = policy_id WHERE user_id = $1',
      [user_id]
    );

    if (result.rowCount && result.rowCount >= 0) {
      return {
        message: () => `The user with ${this.utils.printReceived(user_id)} has ${this.utils.printExpected(result.rowCount)} policies`,
        pass: true,
      };
    }

    return {
      message: () => `The user with ${this.utils.printReceived(user_id)} doesn't have any policies`,
      pass: false,
    };
  };

expect.extend({
  toHasPoliciesInDatabase,
});
