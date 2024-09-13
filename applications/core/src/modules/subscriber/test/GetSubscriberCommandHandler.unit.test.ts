import { faker } from "@faker-js/faker/locale/pt_BR";
import GetSubscriberCommand from "@shared/commands/GetSubscriberCommand";
import GetSubscriberCommandHandler from "@subscriber/app/GetSubscriberCommandHandler";
import SubscriberRepository from "@subscriber/app/SubscriberRepository";
import { PaymentTypes } from "@subscriber/domain/PaymentMethod";
import Subscriber from "@subscriber/domain/Subscriber";
import { mock } from 'jest-mock-extended';

describe('GetSubscriberCommandHandler unit tests', () => {
  const subscriber_repository_mock = mock<SubscriberRepository>();
  const handler = new GetSubscriberCommandHandler(subscriber_repository_mock);

  it("returns NULL if subscriber doens't exist", async () => {
    const result = await handler.handle(new GetSubscriberCommand(faker.string.uuid()));

    expect(result).toBeNull();
  });

  it("returns a subscriber", async () => {
    const subscriber_obj = {
      id: faker.string.uuid(),
      document: faker.string.numeric(11),
      address: {
        state: faker.location.state({ abbreviated: true }),
        street: faker.location.street(),
        district: faker.location.secondaryAddress(),
        number: faker.location.buildingNumber(),
        complement: faker.string.sample(),
      },
      email: faker.internet.email(),
      payment_method: {
        payment_type: faker.helpers.enumValue(PaymentTypes),
        credit_card_external_id: faker.string.uuid(),
      },
      phone_number: faker.string.numeric(11),
      subscriptions: []
    };

    subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(
      new Subscriber(subscriber_obj),
    );

    const result = await handler.handle(new GetSubscriberCommand(faker.string.uuid()));

    expect(result).not.toBeInstanceOf(Subscriber);
    expect(result).toEqual(subscriber_obj);
  });
});
