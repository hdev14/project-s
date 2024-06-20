export default class Either<T = unknown> extends Array {
  0?: T;
  1?: Error;

  private constructor(params: { data?: T, error?: Error }) {
    super(2);
    this[0] = params.data;
    this[1] = params.error;
  }

  static right<T>(data: T) {
    return Object.seal(new Either<T>({ data }));
  }

  static left(error: Error) {
    return Object.seal(new Either<never>({ error }));
  }
}