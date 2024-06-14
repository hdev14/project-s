export default interface ValueObject<T = unknown> {
  get value(): T
}