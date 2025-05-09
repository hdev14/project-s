import FileStorage from "@global/app/FileStorage";
import GetCatalogItemCommand from "@shared/commands/GetCatalogItemCommand";
import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import GetUserCommand from "@shared/commands/GetUserCommand";
import DomainError from "@shared/errors/DomainError";
import NotFoundError from "@shared/errors/NotFoundError";
import Mediator from "@shared/Mediator";
import Queue from "@shared/Queue";
import types from "@shared/types";
import Either from "@shared/utils/Either";
import { PageInfo, PageOptions } from "@shared/utils/Pagination";
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
};

export type GetSubscriptionPlansParams = {
  tenant_id: string;
  page_options?: PageOptions;
};

export type GetSubscriptionPlansResult = {
  result: Array<SubscriptionPlanProps>;
  page_info?: PageInfo;
};

export type GetSubscriptionsParams = {
  tenant_id: string;
  page_options?: PageOptions;
};

export type GetSubscriptionsResult = {
  result: Array<SubscriptionProps>;
  page_info?: PageInfo;
};

@injectable()
export default class SubscriptionService {
  readonly #mediator: Mediator;
  readonly #subscription_plan_repository: SubscriptionPlanRepository;
  readonly #subscription_repository: SubscriptionRepository;
  readonly #file_storage: FileStorage;
  readonly #payment_queue: Queue;

  constructor(
    @inject(types.Mediator) mediator: Mediator,
    @inject(types.SubscriptionPlanRepository) subscription_plan_repository: SubscriptionPlanRepository,
    @inject(types.SubscriptionRepository) subscription_repository: SubscriptionRepository,
    @inject(types.FileStorage) file_storage: FileStorage,
    @inject(types.NewableQueue) queue_constructor: interfaces.Newable<Queue>,
  ) {
    this.#mediator = mediator;
    this.#subscription_plan_repository = subscription_plan_repository;
    this.#subscription_repository = subscription_repository;
    this.#file_storage = file_storage;
    this.#payment_queue = new queue_constructor({ queue: process.env.PAYMENT_QUEUE });
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Either<SubscriptionProps>> {
    const subscriber = await this.#mediator.send<any>(new GetSubscriberCommand(params.subscriber_id));

    if (!subscriber) {
      return Either.left(new NotFoundError('notfound.subscriber'));
    }

    const company = await this.#mediator.send<any>(new GetUserCommand(params.tenant_id));

    if (!company) {
      return Either.left(new NotFoundError('notfound.company'));
    }

    const subscription_plan = await this.#subscription_plan_repository.getSubscriptionPlanById(params.subscription_plan_id);

    if (!subscription_plan) {
      return Either.left(new NotFoundError('notfound.subscription_plan'));
    }

    const subscription = Subscription.createPending({
      subscription_plan_id: subscription_plan.id,
      subscriber_id: subscriber.id,
      tenant_id: company.id,
    });

    await this.#subscription_repository.createSubscription(subscription);

    await this.#payment_queue.addMessage({
      id: randomUUID(),
      name: 'ChargePendingSubscription',
      payload: {
        subscription_id: subscription.id,
        subscriber_id: subscriber.id,
        tenant_id: company.id,
        amount: subscription_plan.toObject().amount,
      }
    });

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

      const company = await this.#mediator.send<any>(new GetUserCommand(params.tenant_id));

      if (!company) {
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
        tenant_id: company.id,
      };

      if (params.term_file) {
        subscription_plan_obj.term_url = await this.#file_storage.storeFile({
          bucket_name: `tenant-${company.id}`,
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
    const page = await this.#subscription_plan_repository.getSubscriptionPlans(params);
    return Either.right(page.toRaw());
  }

  async getSubscriptions(params: GetSubscriptionsParams): Promise<Either<GetSubscriptionsResult>> {
    const page = await this.#subscription_repository.getSubscriptions(params);
    return Either.right(page.toRaw());
  }
}
