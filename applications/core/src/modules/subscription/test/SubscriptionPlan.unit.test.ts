import { faker } from '@faker-js/faker';
import DomainError from "@shared/errors/DomainError";
import SubscriptionPlan, { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';

describe('SubscriptionPlan unit tests', () => {
  it('throws an DomainError if billing_day is not between 1 and 31', () => {
    expect(() => {
      new SubscriptionPlan({
        billing_day: faker.number.int() * -1, // negative
        id: faker.string.uuid(),
        amount: faker.number.float(),
        tenant_id: faker.string.uuid(),
        items: [],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        term_url: faker.internet.url(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      })
    }).toThrow(new DomainError('subscription_plan.billing_day'));

    expect(() => {
      new SubscriptionPlan({
        billing_day: faker.number.int({ min: 32 }), // greater than 31
        id: faker.string.uuid(),
        amount: faker.number.float(),
        tenant_id: faker.string.uuid(),
        items: [],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        term_url: faker.internet.url(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      })
    }).toThrow(new DomainError('subscription_plan.billing_day'));
  });
});
