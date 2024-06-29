export default class DbUtils {
  static columns(obj: object) {
    const columns = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        columns.push(key);
      }
    }

    return `(${columns.toString()})`;
  }

  static sanitizeValues(values: Array<unknown>) {
    const filtered_values: Array<unknown> = [];

    for (let idx = 0; idx <= values.length; idx++) {
      const value = values[idx];
      if (value !== undefined && value !== null) {
        filtered_values.push(value);
      }
    }

    return filtered_values;
  }

  static values(values: Array<unknown>) {
    const options: Array<string> = [];

    for (let idx = 1; idx <= DbUtils.sanitizeValues(values).length; idx++) {
      options.push(`$${idx}`);
    }

    return `(${options.toString()})`;
  }

  static inOperator(values: Array<unknown>): string {
    return `IN ${DbUtils.values(values)}`;
  }
}