import { PageOptions, PaginatedResult } from "@shared/utils/Pagination";
import Subscriber, { SubscriberProps } from "@subscriber/domain/Subscriber";

export type SubscribersFilter = {
  page_options?: PageOptions;
}

export default interface SubscriberRepository {
  updateSubscriber(subscriber: Subscriber): Promise<void>;
  getSubcriberById(id: string): Promise<Subscriber | null>;
  getSubscribers(filter?: SubscribersFilter): Promise<PaginatedResult<SubscriberProps>>;
}
