import { PageOptions } from "@shared/utils/Pagination";
import Subscriber from "@subscriber/domain/Subscriber";

export default interface SubscriberRepository {
  createSubscriber(subscriber: Subscriber): Promise<void>;
  updateSubscriber(subscriber: Subscriber): Promise<void>;
  getSubcriberById(id: string): Promise<Subscriber | null>;
  getSubscribers(pagination: PageOptions): Promise<Array<Subscriber>>;
}