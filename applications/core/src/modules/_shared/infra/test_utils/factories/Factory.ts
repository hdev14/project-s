export default interface Factory<T> {
  createOne(item: T): Promise<T>;
  createMany(items: T[]): Promise<T[]>;
}
