import { faker } from '@faker-js/faker/locale/pt_BR';
import NotFoundError from '@shared/errors/NotFoundError';
import SubscriberRepository from "@subscriber/app/SubscriberRepository";
import SubscriberService from "@subscriber/app/SubscriberService";
import { PaymentTypes } from '@subscriber/domain/PaymentMethod';
import Subscriber from "@subscriber/domain/Subscriber";
import { mock } from "jest-mock-extended";

describe('SubscriberService unit tests', () => {
  const subscriber_repository_mock = mock<SubscriberRepository>();
  const subscriber_service = new SubscriberService(subscriber_repository_mock);

  describe('SubscriberService.getSubscriber', () => {
    it('returns a subscriber', async () => {
      const subscriber_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
        address: {
          street: faker.location.street(),
          district: faker.string.sample(),
          number: faker.location.buildingNumber(),
          state: faker.location.state({ abbreviated: true }),
          complement: faker.string.sample(),
        },
        payment_method: {
          payment_type: faker.helpers.enumValue(PaymentTypes),
          credit_card_external_id: faker.string.uuid(),
        },
        subscriptions: [],
      };
      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(
        new Subscriber(subscriber_obj)
      );

      const subscriber_id = faker.string.uuid();

      const [data, error] = await subscriber_service.getSubscriber({ subscriber_id });

      expect(error).toBeUndefined();
      expect(data).toEqual(subscriber_obj);
    });

    it("returns a not found error if subscriber doesn't exist", async () => {
      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(null);

      const subscriber_id = faker.string.uuid();

      const [data, error] = await subscriber_service.getSubscriber({ subscriber_id });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
    });
  });
});
