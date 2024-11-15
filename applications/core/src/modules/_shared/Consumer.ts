export type ConsumerOptions<Params extends Array<any>> = {
  queue_name: string,
  handler: (...args: Params) => Promise<void>;
}
export default abstract class Consumer<Params extends Array<any>> {
  constructor(protected options: ConsumerOptions<Params>) { }
}
