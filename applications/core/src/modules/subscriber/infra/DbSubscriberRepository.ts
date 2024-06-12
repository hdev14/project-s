import PaginationOptions from "@share/PaginationOptions";
import SubscriberRepository from "@subscriber/app/SubscriberRepository";
import Subscriber from "@subscriber/domain/Subscriber";

export default class DbSubscriberRepository implements SubscriberRepository {
  getSubscribers(pagination: PaginationOptions): Promise<Subscriber[]> {
    throw new Error("Method not implemented.");
  }
  createSubscriber(subscriber: Subscriber): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateSubscriber(subscriber: Subscriber): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getSubcriberById(id: string): Promise<Subscriber | null> {
    throw new Error("Method not implemented.");
  }
}