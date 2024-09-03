import { faker } from '@faker-js/faker/locale/pt_BR';
import GetSubscriberCommand from '@shared/commands/GetSubscriberCommand';
import UserExistsCommand from '@shared/commands/UserExistsCommand';
import DomainError from '@shared/errors/DomainError';
import NotFoundError from '@shared/errors/NotFoundError';
import Mediator from '@shared/Mediator';
import SubscriptionRepository from '@subscription/app/SubcriptionRepository';
import { SubscriptionPlanRepository } from '@subscription/app/SubscriptionPlanRepository';
import SubscriptionService from "@subscription/app/SubscriptionService";
import Subscription, { SubscriptionStatus } from '@subscription/domain/Subscription';
import SubscriptionPlan, { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';
import { mock } from 'jest-mock-extended';

describe('SubscriptionService unit tests', () => {
  const mediator_mock = mock<Mediator>();
  const subscription_plan_repository_mock = mock<SubscriptionPlanRepository>();
  const subscription_repository_mock = mock<SubscriptionRepository>();
  const subscription_service = new SubscriptionService(
    mediator_mock,
    subscription_plan_repository_mock,
    subscription_repository_mock
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
});

