import Either from "@shared/utils/Either";
import { SubscriberObject } from "@subscriber/domain/Subscriber";

export default class SubscriberService {
  async createSubscriber(params: {}): Promise<Either<SubscriberObject>> {
    return Either.left(new Error());
  }

  async updateSubscriber(params: {}): Promise<Either<SubscriberObject>> {
    return Either.left(new Error());
  }
}