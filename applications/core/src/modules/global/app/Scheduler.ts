export type AddSchedulerParams = {
  name: string;
  cron_string: string,
  handler: (...args: any[]) => void | any | Promise<any>
}

export default interface Scheduler {
  add(params: AddSchedulerParams): void;
}
