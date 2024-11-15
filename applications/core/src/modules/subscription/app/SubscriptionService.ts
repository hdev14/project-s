import FileStorage from "@global/app/FileStorage";
import GetCatalogItemCommand from "@shared/commands/GetCatalogItemCommand";
import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import UserExistsCommand from "@shared/commands/UserExistsCommand";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import Mediator from "@shared/Mediator";
import Queue from "@shared/Queue";
import types from "@shared/types";
import Either from "@shared/utils/Either";
import { PageOptions, PageResult } from "@shared/utils/Pagination";
import { ItemProps } from "@subscription/domain/Item";
import Subscription, { SubscriptionProps } from "@subscription/domain/Subscription";
import SubscriptionPlan, { RecurrenceTypes, SubscriptionPlanProps } from "@subscription/domain/SubscriptionPlan";
import { randomUUID } from "crypto";
import { inject, injectable, interfaces } from "inversify";
import 'reflect-metadata';
import { SubscriptionPlanRepository } from "./SubscriptionPlanRepository";
import SubscriptionRepository from "./SubscriptionRepository";

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

export type CancelSubscriptionParams = {
  subscription_id: string;
};

export type CreateSubscriptionPlanParams = {
  item_ids: string[];
  recurrence_type: RecurrenceTypes;
  tenant_id: string;
  term_file?: Buffer;
  billing_day: number;
};

export type GetSubscriptionPlansParams = {
  tenant_id: string;
  page_options?: PageOptions;
};

export type GetSubscriptionPlansResult = {
  results: Array<SubscriptionPlanProps>;
  page_result?: PageResult;
};

export type GetSubscriptionsParams = {
  tenant_id: string;
  page_options?: PageOptions;
};

export type GetSubscriptionsResult = {
  results: Array<SubscriptionProps>;
  page_result?: PageResult;
};

@injectable()
export default class SubscriptionService {
  #mediator: Mediator;
  #subscription_plan_repository: SubscriptionPlanRepository;
  #subscription_repository: SubscriptionRepository;
  #file_storage: FileStorage;
  #payment_queue?: Queue;

  constructor(
    @inject(types.Mediator) mediator: Mediator,
    @inject(types.SubscriptionPlanRepository) subscription_plan_repository: SubscriptionPlanRepository,
    @inject(types.SubscriptionRepository) subscription_repository: SubscriptionRepository,
    @inject(types.FileStorage) file_storage: FileStorage,
    @inject(types.NewableQueue) Queue: interfaces.Newable<Queue>,
  ) {
    this.#mediator = mediator;
    this.#subscription_plan_repository = subscription_plan_repository;
    this.#subscription_repository = subscription_repository;
    this.#file_storage = file_storage;
    // this.#payment_queue = new Queue({ queue: process.env.PAYMENT_QUEUE, attempts: 3 });
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Either<SubscriptionProps>> {

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

  async cancelSubscription(params: CancelSubscriptionParams): Promise<Either<void>> {
    try {
      const subscription = await this.#subscription_repository.getSubscriptionById(params.subscription_id);

      if (!subscription) {
        return Either.left(new NotFoundError('notfound.subscription'));
      }

      subscription.cancel();

      await this.#subscription_repository.updateSubscription(subscription);

      return Either.right();
    } catch (error) {
      if (error instanceof DomainError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async createSubscriptionPlan(params: CreateSubscriptionPlanParams): Promise<Either<SubscriptionPlanProps>> {
    try {
      const promises = [];

      for (let idx = 0; idx < params.item_ids.length; idx++) {
        promises.push(this.#mediator.send<{ id: string, name: string, amount: number, created_at: Date, updated_at: Date }>(
          new GetCatalogItemCommand(params.item_ids[idx]))
        );
      }

      const catalog_items = await Promise.all(promises);

      const tenant_exists = await this.#mediator.send<boolean>(new UserExistsCommand(params.tenant_id));

      if (!tenant_exists) {
        return Either.left(new NotFoundError('notfound.company'));
      }

      let amount = 0;
      const items: ItemProps[] = [];

      for (let idx = 0; idx < catalog_items.length; idx++) {
        const catalog_item = catalog_items[idx];
        amount += catalog_item.amount;
        items.push({
          id: catalog_item.id,
          name: catalog_item.name,
          created_at: catalog_item.created_at,
          updated_at: catalog_item.updated_at,
        });
      }

      const subscription_plan_obj: SubscriptionPlanProps = {
        id: randomUUID(),
        amount,
        items,
        recurrence_type: params.recurrence_type,
        tenant_id: params.tenant_id,
        billing_day: params.billing_day,
      };

      if (params.term_file) {
        subscription_plan_obj.term_url = await this.#file_storage.storeFile({
          bucket_name: `tenant-${params.tenant_id}`,
          file: params.term_file,
          folder: 'subscription_terms',
          name: `term_${subscription_plan_obj.id}.pdf`,
        });
      }

      const subscription_plan = new SubscriptionPlan(subscription_plan_obj);

      await this.#subscription_plan_repository.createSubscriptionPlan(subscription_plan);

      return Either.right(subscription_plan.toObject());
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DomainError) {
        return Either.left(error);
      }

      throw error;
    }
  }

  async getSubscriptionPlans(params: GetSubscriptionPlansParams): Promise<Either<GetSubscriptionPlansResult>> {
    const result = await this.#subscription_plan_repository.getSubscriptionPlans(params);
    return Either.right(result);
  }

  async getSubscriptions(params: GetSubscriptionsParams): Promise<Either<GetSubscriptionsResult>> {
    const result = await this.#subscription_repository.getSubscriptions(params);
    return Either.right(result);
  }

  async payActiveSubscriptions(): Promise<Either<void>> {
    // TODO: get all active subscription (with subscription plan) paginated
    // TODO: for each batch (define quantity) of subscriptions, check if the subscription can be pay (monthly, aanually)
    // TODO: send all subscription to the pay active subscription queue this.#payment_queue.addMessages()
    return Either.left(new Error());
  }
}
