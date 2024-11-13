import { faker } from '@faker-js/faker';
import DomainError from "@shared/errors/DomainError";
import Subscription, { SubscriptionStatus } from "@subscription/domain/Subscription";

describe('Subscription unit tests', () => {
  it('throws an DomainError if billing_day is not between 1 and 31', () => {
    expect(() => {
      new Subscription({
        billing_day: faker.number.int() * -1, // negative
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      })
    }).toThrow(new DomainError('subscription.billing_day'));

    expect(() => {
      new Subscription({
        billing_day: faker.number.int({ min: 32 }), // greater than 31
        status: faker.helpers.enumValue(SubscriptionStatus),
        subscriber_id: faker.string.uuid(),
        subscription_plan_id: faker.string.uuid(),
        tenant_id: faker.string.uuid(),
      })
    }).toThrow(new DomainError('subscription.billing_day'));
  });
});
