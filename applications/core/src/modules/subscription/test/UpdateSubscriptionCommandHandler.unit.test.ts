import { faker } from '@faker-js/faker/locale/pt_BR';
import EmailService from '@global/app/EmailService';
import { SubscriptionPlanRepository } from "@subscription/app/SubscriptionPlanRepository";
import SubscriptionRepository from "@subscription/app/SubscriptionRepository";
import UpdateSubscriptionCommandHandler from "@subscription/app/UpdateSubscriptionCommandHandler";
import Subscription, { SubscriptionStatus } from "@subscription/domain/Subscription";
import SubscriptionPlan, { RecurrenceTypes } from "@subscription/domain/SubscriptionPlan";
import { mock } from "jest-mock-extended";

describe('UpdateSubscriptionCommandHandler unit tests', () => {
  const subscription_repository_mock = mock<SubscriptionRepository>();
  const subscription_plan_repository_mock = mock<SubscriptionPlanRepository>();
  const email_service_mock = mock<EmailService>();
  const handler = new UpdateSubscriptionCommandHandler(
    subscription_repository_mock,
    subscription_plan_repository_mock,
    email_service_mock
  );

  it('pause subscription', async () => {
    subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(
      new Subscription({
        status: SubscriptionStatus.ACTIVE,
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      })
    );

    const command = {
      customer_email: faker.internet.email(),
      name: faker.person.fullName(),
      subscription_id: faker.string.uuid(),
      pause_subscription: true,
      reason: faker.string.sample(),
    };

    await handler.handle(command);

    expect(subscription_repository_mock.getSubscriptionById).toHaveBeenCalledWith(command.subscription_id);
    expect(subscription_repository_mock.updateSubscription).toHaveBeenCalledTimes(1);
    const subscription_status = subscription_repository_mock.updateSubscription.mock.calls[0][0].toObject().status;
    expect(subscription_status).toEqual(SubscriptionStatus.PAUSED);
  });

  it('change next_billing_date annually if subscription plan is annually', async () => {
    const subscription = new Subscription({
      status: SubscriptionStatus.PAUSED,
      subscriber_id: faker.string.uuid(),
      subscription_plan_id: faker.string.uuid(),
      tenant_id: faker.string.uuid(),
    });

    const next_billing_date = faker.date.past();

    const subscription_plan = new SubscriptionPlan({
      amount: faker.number.float(),
      items: [],
      recurrence_type: RecurrenceTypes.ANNUALLY,
      tenant_id: faker.string.uuid(),
      next_billing_date,
    });

    subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(subscription);
    subscription_plan_repository_mock.getSubscriptionPlanById.mockResolvedValueOnce(subscription_plan);

    await handler.handle({
      customer_email: faker.internet.email(),
      name: faker.person.fullName(),
      subscription_id: faker.string.uuid(),
      pause_subscription: false,
      reason: faker.string.sample(),
    });

    expect(subscription_plan_repository_mock.getSubscriptionPlanById).toHaveBeenCalledWith(subscription.toObject().subscription_plan_id);
    expect(subscription_plan_repository_mock.updateSubscriptionPlan).toHaveBeenCalledTimes(1);
    const new_next_billing_date = subscription_plan_repository_mock.updateSubscriptionPlan.mock.calls[0][0].toObject().next_billing_date!
    expect(new_next_billing_date.getFullYear()).toEqual(next_billing_date.getFullYear() + 1);
    expect(new_next_billing_date.getMonth()).toEqual(next_billing_date.getMonth());
  });

  it('change next_billing_date monthly if subscription plan is monthly', async () => {
    const subscription = new Subscription({
      status: SubscriptionStatus.PAUSED,
      subscriber_id: faker.string.uuid(),
      subscription_plan_id: faker.string.uuid(),
      tenant_id: faker.string.uuid(),
    });

    const next_billing_date = faker.date.past();

    const subscription_plan = new SubscriptionPlan({
      amount: faker.number.float(),
      items: [],
      recurrence_type: RecurrenceTypes.MONTHLY,
      tenant_id: faker.string.uuid(),
      next_billing_date,
    });

    subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(subscription);
    subscription_plan_repository_mock.getSubscriptionPlanById.mockResolvedValueOnce(subscription_plan);

    await handler.handle({
      customer_email: faker.internet.email(),
      name: faker.person.fullName(),
      subscription_id: faker.string.uuid(),
      pause_subscription: false,
      reason: faker.string.sample(),
    });

    expect(subscription_plan_repository_mock.getSubscriptionPlanById).toHaveBeenCalledWith(subscription.toObject().subscription_plan_id);
    expect(subscription_plan_repository_mock.updateSubscriptionPlan).toHaveBeenCalledTimes(1);
    const new_next_billing_date = subscription_plan_repository_mock.updateSubscriptionPlan.mock.calls[0][0].toObject().next_billing_date!
    expect(new_next_billing_date.getFullYear()).toEqual(next_billing_date.getFullYear());
    expect(new_next_billing_date.getMonth()).toEqual(next_billing_date.getMonth() + 1);
  });

  it('send an email when the subscription was paused', async () => {
    const subscription = new Subscription({
      status: SubscriptionStatus.ACTIVE,
      subscriber_id: faker.string.uuid(),
      subscription_plan_id: faker.string.uuid(),
      tenant_id: faker.string.uuid(),
    });

    subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(subscription);

    const command = {
      customer_email: faker.internet.email(),
      name: faker.person.fullName(),
      subscription_id: faker.string.uuid(),
      pause_subscription: true,
      reason: faker.string.sample(),
    };

    await handler.handle(command);

    expect(email_service_mock.send).toHaveBeenCalledWith({
      email: command.customer_email,
      title: 'Assinatura Pausada',
      message: `Sua assinatura foi pausada pelo seguinte motivo: ${command.reason}`,
    });
  });

  it('send an email when the subscription was renewed', async () => {
    const subscription = new Subscription({
      status: SubscriptionStatus.PAUSED,
      subscriber_id: faker.string.uuid(),
      subscription_plan_id: faker.string.uuid(),
      tenant_id: faker.string.uuid(),
    });

    const subscription_plan = new SubscriptionPlan({
      amount: faker.number.float(),
      items: [],
      recurrence_type: RecurrenceTypes.MONTHLY,
      tenant_id: faker.string.uuid(),
      next_billing_date: faker.date.past(),
    });

    subscription_repository_mock.getSubscriptionById.mockResolvedValueOnce(subscription);
    subscription_plan_repository_mock.getSubscriptionPlanById.mockResolvedValueOnce(subscription_plan);


    const command = {
      customer_email: faker.internet.email(),
      name: faker.person.fullName(),
      subscription_id: faker.string.uuid(),
      pause_subscription: false,
      reason: faker.string.sample(),
    };

    await handler.handle(command);

    expect(email_service_mock.send).toHaveBeenCalledWith({
      email: command.customer_email,
      title: 'Assinatura Renovada',
      message: `Sua assinatura foi renovada com sucesso`,
    });
  });
});
