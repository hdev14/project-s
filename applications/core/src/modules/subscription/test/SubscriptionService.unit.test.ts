import { faker } from '@faker-js/faker/locale/pt_BR';
import GetSubscriberCommand from '@shared/commands/GetSubscriberCommand';
import UserExistsCommand from '@shared/commands/UserExistsCommand';
import DomainError from '@shared/errors/DomainError';
import NotFoundError from '@shared/errors/NotFoundError';
import FileStorage from '@shared/infra/FileStorage';
import Mediator from '@shared/Mediator';
import { SubscriptionPlanRepository } from '@subscription/app/SubscriptionPlanRepository';
import SubscriptionRepository from '@subscription/app/SubscriptionRepository';
import SubscriptionService from "@subscription/app/SubscriptionService";
import Subscription, { SubscriptionStatus } from '@subscription/domain/Subscription';
import SubscriptionPlan, { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';
import { mock } from 'jest-mock-extended';

describe('SubscriptionService unit tests', () => {
  const mediator_mock = mock<Mediator>();
  const subscription_plan_repository_mock = mock<SubscriptionPlanRepository>();
  const subscription_repository_mock = mock<SubscriptionRepository>();
  const file_storage_mock = mock<FileStorage>();
  const subscription_service = new SubscriptionService(
    mediator_mock,
    subscription_plan_repository_mock,
    subscription_repository_mock,
    file_storage_mock,
  );

  describe('SubscriptionService.createSubscription', () => {
    it("throws a not found error if subscriber doesn't exist", async () => {
      mediator_mock.send.mockResolvedValueOnce(null);

      const [error, data] = await subscription_service.createSubscription({
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.subscriber');
      const param = mediator_mock.send.mock.calls[0][0];
      expect(param).toBeInstanceOf(GetSubscriberCommand);
    });

    it("throws a not found error if tenant doesn't exist", async () => {
      mediator_mock.send
        .mockResolvedValueOnce({ id: faker.string.uuid() })
        .mockResolvedValueOnce(false);

      const [error, data] = await subscription_service.createSubscription({
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.company');
      const param = mediator_mock.send.mock.calls[1][0];
      expect(param).toBeInstanceOf(UserExistsCommand);
    });

    it("throws a not found error if subscription plan doesn't exist", async () => {
      mediator_mock.send
        .mockResolvedValueOnce({ id: faker.string.uuid() })
        .mockResolvedValueOnce(true);

      subscription_plan_repository_mock.getSubscriptionPlanById.mockResolvedValueOnce(null);

      const params = {
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      };
      const [error, data] = await subscription_service.createSubscription(params);

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.subscription_plan');
      expect(subscription_plan_repository_mock.getSubscriptionPlanById).toHaveBeenCalledWith(params.subscription_plan_id);
    });

    it('creates a new pending subscription', async () => {
      const subscriber_id = faker.string.uuid();
      const subscription_plan_id = faker.string.uuid();

      mediator_mock.send
        .mockResolvedValueOnce({ id: subscriber_id })
        .mockResolvedValueOnce(true);

      subscription_plan_repository_mock.getSubscriptionPlanById.mockResolvedValueOnce(
        new SubscriptionPlan({
          id: subscription_plan_id,
          items: [{ id: faker.string.uuid(), name: faker.commerce.product() }],
          amount: faker.number.float(),
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: faker.string.uuid(),
        })
      );

      const params = {
        subscriber_id,
        subscription_plan_id,
        tenant_id: faker.string.uuid(),
      };

      const [error, data] = await subscription_service.createSubscription(params);

      expect(error).toBeUndefined();
      expect(data).toHaveProperty('id');
      expect(data!.status).toEqual(SubscriptionStatus.PENDING);
      expect(data!.subscriber_id).toEqual(subscriber_id);
      expect(data!.subscription_plan_id).toEqual(subscription_plan_id);
      expect(data!.tenant_id).toEqual(params.tenant_id);
      expect(subscription_repository_mock.createSubscription).toHaveBeenCalled();
    });
  });

  describe('SubscriptionService.activeSubscription', () => {
    it("returns a not found error if subscription doesn't exist", async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(null);

      const [error, data] = await subscription_service.activeSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.subscription');
    });

    it('updates status and started_at properties of subscription', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.PENDING,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.activeSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeUndefined();
      expect(subscription_repository_mock.updateSubscription).toHaveBeenCalled();
      const param = subscription_repository_mock.updateSubscription.mock.calls[0][0].toObject();
      expect(param.started_at).toBeDefined();
      expect(param.status).toEqual(SubscriptionStatus.ACTIVE);
    });

    it('returns a domain error when trying to active an active subscription', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.ACTIVE,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.activeSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_actived');
    });

    it('returns a domain error when trying to active a subscription that is canceled', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.CANCELED,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.activeSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_canceled');
    });

    it('returns a domain error when trying to active a subscription that is finished', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.FINISHED,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.activeSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_finished');
    });
  });

  describe('SubscriptionService.pauseSubscription', () => {
    it("returns a not found error if subscription doesn't exist", async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(null);

      const [error, data] = await subscription_service.pauseSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.subscription');
    });

    it('updates status of subscription to paused', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.ACTIVE,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.pauseSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeUndefined();
      expect(subscription_repository_mock.updateSubscription).toHaveBeenCalled();
      const param = subscription_repository_mock.updateSubscription.mock.calls[0][0].toObject();
      expect(param.status).toEqual(SubscriptionStatus.PAUSED);
    });

    it('returns a domain error when trying to pause a subscription that is paused', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.PAUSED,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.pauseSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_paused');
    });

    it('returns a domain error when trying to pause a subscription that is pending', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.PENDING,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.pauseSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_pending');
    });

    it('returns a domain error when trying to pause a subscription that is canceled', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.CANCELED,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.pauseSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_canceled');
    });

    it('returns a domain error when trying to pause a subscription that is finished', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.FINISHED,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.pauseSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_finished');
    });
  });

  describe('SubscriptionService.cancelSubscription', () => {
    it("returns a not found error if subscription doesn't exist", async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(null);

      const [error, data] = await subscription_service.cancelSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.subscription');
    });

    it('updates status of subscription to canceled', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.ACTIVE,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.cancelSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeUndefined();
      expect(subscription_repository_mock.updateSubscription).toHaveBeenCalled();
      const param = subscription_repository_mock.updateSubscription.mock.calls[0][0].toObject();
      expect(param.status).toEqual(SubscriptionStatus.CANCELED);
    });

    it('returns a domain error when trying to cancel a subscription that is finished', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.FINISHED,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.cancelSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_finished');
    });

    it('returns a domain error when trying to cancel a subscription that is already canceled', async () => {
      subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
        new Subscription({
          status: SubscriptionStatus.CANCELED,
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: faker.string.uuid(),
          tenant_id: faker.string.uuid(),
        })
      );

      const [error] = await subscription_service.cancelSubscription({
        subscription_id: faker.string.uuid(),
      });

      expect(error).toBeInstanceOf(DomainError);
      expect(error!.message).toEqual('subscription_canceled');
    });
  });

  describe('SubscriptionService.createSubcriptionPlan', () => {
    it("returns a not found error if some of the items doesn't exist", async () => {
      mediator_mock.send
        .mockResolvedValueOnce({ id: faker.string.uuid() })
        .mockRejectedValueOnce(new NotFoundError('notfound.catalog_item'));

      const [error, data] = await subscription_service.createSubscriptionPlan({
        item_ids: [faker.string.uuid(), faker.string.uuid()],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.catalog_item');
    });

    it("returns a not found error if tenant doesn't exist", async () => {
      mediator_mock.send
        .mockResolvedValueOnce({ id: faker.string.uuid() })
        .mockResolvedValueOnce(false);

      const [error, data] = await subscription_service.createSubscriptionPlan({
        item_ids: [faker.string.uuid()],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.company');
    });

    it('creates a new subscription plan', async () => {
      const catalog_item_1 = {
        id: faker.string.uuid(),
        name: faker.commerce.product(),
        amount: faker.number.float()
      };

      const catalog_item_2 = {
        id: faker.string.uuid(),
        name: faker.commerce.product(),
        amount: faker.number.float()
      };

      mediator_mock.send
        .mockResolvedValueOnce(catalog_item_1)
        .mockResolvedValueOnce(catalog_item_2)
        .mockResolvedValueOnce(true);

      const params = {
        item_ids: [faker.string.uuid(), faker.string.uuid()],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: faker.string.uuid(),
      };

      const [error, data] = await subscription_service.createSubscriptionPlan(params);

      expect(error).toBeUndefined();
      expect(data).toHaveProperty('id');
      expect(data!.amount).toEqual(catalog_item_1.amount + catalog_item_2.amount);
      expect(data!.tenant_id).toEqual(params.tenant_id);
      expect(data!.recurrence_type).toEqual(params.recurrence_type);
      expect(data!.term_url).toBeUndefined();
      expect(data!.items).toEqual([
        { id: catalog_item_1.id, name: catalog_item_1.name },
        { id: catalog_item_2.id, name: catalog_item_2.name }
      ]);
      expect(subscription_plan_repository_mock.createSubscriptionPlan).toHaveBeenCalledTimes(1);
    });

    it('creates a new subscription plan with a term', async () => {
      const catalog_item_1 = {
        id: faker.string.uuid(),
        name: faker.commerce.product(),
        amount: faker.number.float()
      };

      const catalog_item_2 = {
        id: faker.string.uuid(),
        name: faker.commerce.product(),
        amount: faker.number.float()
      };

      mediator_mock.send
        .mockResolvedValueOnce(catalog_item_1)
        .mockResolvedValueOnce(catalog_item_2)
        .mockResolvedValueOnce(true);

      const term_url = faker.internet.url();
      file_storage_mock.storeFile.mockResolvedValueOnce(term_url);

      const params = {
        item_ids: [faker.string.uuid(), faker.string.uuid()],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: faker.string.uuid(),
        term_file: Buffer.from([1, 2, 3]),
      };

      const [error, data] = await subscription_service.createSubscriptionPlan(params);

      expect(error).toBeUndefined();
      expect(data).toHaveProperty('id');
      expect(data!.amount).toEqual(catalog_item_1.amount + catalog_item_2.amount);
      expect(data!.tenant_id).toEqual(params.tenant_id);
      expect(data!.recurrence_type).toEqual(params.recurrence_type);
      expect(data!.term_url).toEqual(term_url);
      expect(data!.items).toEqual([
        { id: catalog_item_1.id, name: catalog_item_1.name },
        { id: catalog_item_2.id, name: catalog_item_2.name }
      ]);

      expect(subscription_plan_repository_mock.createSubscriptionPlan).toHaveBeenCalledTimes(1);
      const subscription_plan = subscription_plan_repository_mock.createSubscriptionPlan.mock.calls[0][0];

      expect(file_storage_mock.storeFile).toHaveBeenCalledWith({
        bucket_name: `tenant_${params.tenant_id}`,
        folder: 'subscription_terms',
        name: `term_${subscription_plan.id}`,
        file: params.term_file,
      });
    });
  });

  describe('SubscriptionService.getSubscriptionPlans', () => {
    it('returns a list of subscription plans', async () => {
      subscription_plan_repository_mock.getSubscriptionPlans.mockResolvedValueOnce({
        results: [
          {
            id: faker.string.uuid(),
            items: [{
              id: faker.string.uuid(),
              name: faker.commerce.product(),
            }],
            amount: faker.number.float(),
            recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
            term_url: faker.internet.url(),
            tenant_id: faker.string.uuid(),
          },
          {
            id: faker.string.uuid(),
            items: [{
              id: faker.string.uuid(),
              name: faker.commerce.product(),
            }],
            amount: faker.number.float(),
            recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
            term_url: faker.internet.url(),
            tenant_id: faker.string.uuid(),
          }
        ],
        page_result: {
          next_page: 2,
          total_of_pages: 2,
        }
      });

      const params = {
        tenant_id: faker.string.uuid(),
        page_options: {
          limit: faker.number.int(),
          page: faker.number.int(),
        }
      };

      const [error, data] = await subscription_service.getSubscriptionPlans(params);

      expect(error).toBeUndefined();
      expect(data!.results[0]).not.toBeInstanceOf(SubscriptionPlan);
      expect(data!.results).toHaveLength(2);
      expect(data!.page_result).toEqual({
        next_page: 2,
        total_of_pages: 2
      });
      expect(subscription_plan_repository_mock.getSubscriptionPlans).toHaveBeenCalledWith(params);
    });
  });

  describe('SubscriptionService.getSubscriptions', () => {
    it('returns a list of subscriptions', async () => {
      subscription_repository_mock.getSubscriptions.mockResolvedValueOnce({
        results: [
          {
            id: faker.string.uuid(),
            status: faker.helpers.enumValue(SubscriptionStatus),
            subscriber_id: faker.string.uuid(),
            subscription_plan_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
          },
          {
            id: faker.string.uuid(),
            status: faker.helpers.enumValue(SubscriptionStatus),
            subscriber_id: faker.string.uuid(),
            subscription_plan_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
          },
        ],
        page_result: {
          next_page: 2,
          total_of_pages: 2,
        }
      });

      const params = {
        tenant_id: faker.string.uuid(),
        page_options: {
          limit: faker.number.int(),
          page: faker.number.int(),
        }
      };

      const [error, data] = await subscription_service.getSubscriptions(params);

      expect(error).toBeUndefined();
      expect(data!.results[0]).not.toBeInstanceOf(Subscription);
      expect(data!.results).toHaveLength(2);
      expect(data!.page_result).toEqual({
        next_page: 2,
        total_of_pages: 2
      });
      expect(subscription_repository_mock.getSubscriptions).toHaveBeenCalledWith(params);
    });
  });
});

