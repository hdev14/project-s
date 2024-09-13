export default class DbUtils {
  static columns(obj: Record<string, any>) {
    const columns = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        columns.push(key);
      }
    }

    return `(${columns.toString()})`;
  }

  static setColumns(obj: Record<string, any>) {
    const columns = DbUtils.createColumns(obj, 2);

    return columns.toString();
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

  static andOperator(obj: Record<string, any>): string {
    const columns = DbUtils.createColumns(obj);
    return columns.join(' AND ').toString();
  }

  static manyToManyValues(items: { id?: string }[]) {
    const ids = [];
    let string_values = '';

    for (let idx = 0; idx < items.length; idx++) {
      ids.push(items[idx].id!);

      if (idx !== items.length - 1) {
        string_values += `($1,$${idx + 2}), `;
        continue;
      }

      string_values += `($1,$${idx + 2})`;
    }

    return { ids, string_values };
  }

  private static createColumns(obj: Record<string, any>, start_position?: number) {
    const keys = Object.keys(obj);
    let position = start_position ?? 1;
    const columns = [];

    for (let idx = 0; idx < keys.length; idx++) {
      const key = keys[idx];
      if (obj[key] !== undefined && obj[key] !== null && key !== 'id') {
        columns.push(`${key}=$${position}`);
        position++;
      }
    }

    return columns;
  }
}
