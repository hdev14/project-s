import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import Handler from "@shared/Handler";
import { SubscriberObject } from "@subscriber/domain/Subscriber";

export default class GetSubscriberCommandHandler implements Handler<GetSubscriberCommand, SubscriberObject> {
  handle(command: GetSubscriberCommand): Promise<SubscriberObject> {
    throw new Error("Method not implemented.");
  }
}
