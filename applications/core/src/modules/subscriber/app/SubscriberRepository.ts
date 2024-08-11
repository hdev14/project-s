import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";
import Subscriber from "@subscriber/domain/Subscriber";

export type SubscribersFilter = {
  tenant_id: string;
  page_options: PageOptions;
}

export default interface SubscriberRepository {
  createSubscriber(subscriber: Subscriber): Promise<void>;
  updateSubscriber(subscriber: Subscriber): Promise<void>;
  getSubcriberById(id: string): Promise<Subscriber | null>;
  getSubscribers(filter: SubscribersFilter): Promise<PaginatedResult<Subscriber>>;
}
