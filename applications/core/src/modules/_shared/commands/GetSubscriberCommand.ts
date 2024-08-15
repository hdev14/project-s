import Command from "@shared/Command";

export default class GetSubscriberCommand extends Command {
  constructor(readonly subscriber_id: string) {
    super();
  }
}
