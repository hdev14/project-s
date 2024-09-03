export default class Either<T = unknown> extends Array {
  0?: Error;
  1?: T;

  private constructor(params: { error?: Error, data?: T, }) {
    super(2);
    this[0] = params.error;
    this[1] = params.data;
  }

  static right<T>(data?: T) {
    return Object.seal(new Either<T>({ data }));
  }

  static left(error: Error) {
    return Object.seal(new Either<never>({ error }));
  }
}
