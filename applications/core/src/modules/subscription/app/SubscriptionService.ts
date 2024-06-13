import Either from "@share/Either";
import { SubscriptionObject } from "@subscriber/domain/Subscription";
import { SubscriptionPlanObject } from "@subscription/domain/SubscriptionPlan";

export default class SubscriptionService {
  async createSubscription(params: {}): Promise<Either<SubscriptionObject>> {
    return Either.left(new Error());
  }

  async activeSubscription(params: {}): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async pauseSubscription(params: {}): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async cancelSubscription(params: {}): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async createSubscriptionPlan(params: {}): Promise<Either<SubscriptionPlanObject>> {
    return Either.left(new Error());
  }

  async getSubscriptionPlans(params: {}): Promise<Either<Array<SubscriptionPlanObject>>> {
    return Either.left(new Error());
  }

  async getSubscriptions(params: {}): Promise<Either<Array<SubscriptionObject>>> {
    return Either.left(new Error());
  }
}