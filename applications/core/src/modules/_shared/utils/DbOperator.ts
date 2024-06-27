export default class DbOperator {
  static IN(values: Array<unknown>): string {
    let in_operator = '';

    for (let idx = 1; idx <= values.length; idx++) {
      if (idx === values.length && idx === 1) {
        in_operator += `($${idx})`;
        break;
      }

      if (idx === 1) {
        in_operator += `($${idx}`;
        continue;
      }

      if (idx === values.length) {
        in_operator += `, $${idx})`;
        continue;
      }

      in_operator += `, $${idx}`;
    }

    return in_operator;
  }
}