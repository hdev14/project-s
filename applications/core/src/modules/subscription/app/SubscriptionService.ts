import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import UserExistsCommand from "@shared/commands/UserExistsCommand";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import Mediator from "@shared/Mediator";
import Either from "@shared/utils/Either";
import Subscription, { SubscriptionObject } from "@subscription/domain/Subscription";
import { SubscriptionPlanObject } from "@subscription/domain/SubscriptionPlan";
import SubscriptionRepository from "./SubcriptionRepository";
import { SubscriptionPlanRepository } from "./SubscriptionPlanRepository";

export type CreateSubscriptionParams = {
  subscriber_id: string;
  subscription_plan_id: string;
  tenant_id: string;
};

export type ActiveSubscriptionParams = {
  subscription_id: string;
};

export type PauseSubscriptionParams = {
  subscription_id: string;
};

export default class SubscriptionService {
  #mediator: Mediator;
  #subscription_plan_repository: SubscriptionPlanRepository;
  #subscription_repository: SubscriptionRepository;

  constructor(
    mediator: Mediator,
    subscription_plan_repository: SubscriptionPlanRepository,
    subscription_repository: SubscriptionRepository,
  ) {
    this.#mediator = mediator;
    this.#subscription_plan_repository = subscription_plan_repository;
    this.#subscription_repository = subscription_repository;
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Either<SubscriptionObject>> {
    const subscriber = await this.#mediator.send<any>(new GetSubscriberCommand(params.subscriber_id));

    if (!subscriber) {
      return Either.left(new NotFoundError('notfound.subscriber'));
    }

    const has_company = await this.#mediator.send<boolean>(new UserExistsCommand(params.tenant_id));

    if (!has_company) {
      return Either.left(new NotFoundError('notfound.company'));
    }

    const subscription_plan = await this.#subscription_plan_repository.getSubscriptionPlanById(params.subscription_plan_id);

    if (!subscription_plan) {
      return Either.left(new NotFoundError('notfound.subscription_plan'));
    }

    const subscription = Subscription.createPending({
      subscription_plan_id: subscription_plan.id,
      subscriber_id: subscriber.id,
      tenant_id: params.tenant_id,
    });

    await this.#subscription_repository.createSubscription(subscription);

    return Either.right(subscription.toObject());
  }

  async activeSubscription(params: ActiveSubscriptionParams): Promise<Either<void>> {
    try {
      const subscription = await this.#subscription_repository.getSubscriptionById(params.subscription_id);

      if (!subscription) {
        return Either.left(new NotFoundError('notfound.subscription'));
      }

      subscription.active();

      await this.#subscription_repository.updateSubscription(subscription);

      return Either.right();
    } catch (error) {
      if (error instanceof DomainError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async pauseSubscription(params: PauseSubscriptionParams): Promise<Either<void>> {
    try {
      const subscription = await this.#subscription_repository.getSubscriptionById(params.subscription_id);

      if (!subscription) {
        return Either.left(new NotFoundError('notfound.subscription'));
      }

      subscription.pause();

      await this.#subscription_repository.updateSubscription(subscription);

      return Either.right();
    } catch (error) {
      if (error instanceof DomainError) {
        return Either.left(error);
      }

      throw error;
    }
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

  async updateSubscriptionTerm(params: {}): Promise<Either<void>> {
    // TODO: update term and send emails
    return Either.left(new Error());
  }
}
