import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import Handler from "@shared/Handler";
import { SubscriberProps } from "@subscriber/domain/Subscriber";
import SubscriberRepository from "./SubscriberRepository";

export default class GetSubscriberCommandHandler implements Handler<GetSubscriberCommand, SubscriberProps | null> {
  #subscriber_repository: SubscriberRepository;

  constructor(subscriber_repository: SubscriberRepository) {
    this.#subscriber_repository = subscriber_repository;
  }

  async handle(command: GetSubscriberCommand): Promise<SubscriberProps | null> {
    const subscriber = await this.#subscriber_repository.getSubcriberById(command.subscriber_id);

    return subscriber ? subscriber.toObject() : null;
  }
}
