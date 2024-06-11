export default class Either<T = any> extends Array {
  private constructor(params: { data?: T, error?: Error }) {
    super(2);
    this[0] = params.data;
    this[1] = params.error;
  }

  static right<T>(data: any) {
    return Object.seal(new Either<T>({ data }));
  }

  static left(error: Error) {
    return Object.seal(new Either({ error }));
  }

}