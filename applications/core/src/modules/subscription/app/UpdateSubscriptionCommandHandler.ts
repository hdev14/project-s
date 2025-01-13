import UpdateSubscriptionCommand from "@shared/commands/UpdateSubscriptionCommand";
import Handler from "@shared/Handler";

export default class UpdateSubscriptionCommandHandler implements Handler<UpdateSubscriptionCommand, void> {
  handle(command: UpdateSubscriptionCommand): Promise<void> {
    // TODO: pause subscription if it hasn't been pay
    // TODO: send a notifiction via email
    throw new Error("Method not implemented.");
  }
}
