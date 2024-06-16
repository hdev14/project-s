import PaginationOptions from "@shared/utils/PaginationOptions";
import Subscriber from "@subscriber/domain/Subscriber";

export default interface SubscriberRepository {
  createSubscriber(subscriber: Subscriber): Promise<void>;
  updateSubscriber(subscriber: Subscriber): Promise<void>;
  getSubcriberById(id: string): Promise<Subscriber | null>;
  getSubscribers(pagination: PaginationOptions): Promise<Array<Subscriber>>;
}