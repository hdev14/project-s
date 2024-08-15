import { faker } from '@faker-js/faker/locale/pt_BR';
import SaveCreditCardCommand from '@shared/commands/SaveCreditCardCommand';
import CreditCardError from '@shared/errors/CreditCardError';
import NotFoundError from '@shared/errors/NotFoundError';
import Mediator from '@shared/Mediator';
import SubscriberRepository from "@subscriber/app/SubscriberRepository";
import SubscriberService from "@subscriber/app/SubscriberService";
import { PaymentTypes } from '@subscriber/domain/PaymentMethod';
import Subscriber from "@subscriber/domain/Subscriber";
import { mock } from "jest-mock-extended";

describe('SubscriberService unit tests', () => {
  const subscriber_repository_mock = mock<SubscriberRepository>();
  const mediator_mock = mock<Mediator>();
  const subscriber_service = new SubscriberService(subscriber_repository_mock, mediator_mock);

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

  describe('SubscriberService.updateSubscriberAddress', () => {
    it("returns a not found error if subscriber doesn't exist", async () => {
      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(null);

      const params = {
        subscriber_id: faker.string.uuid(),
        street: faker.location.street(),
        district: faker.location.secondaryAddress(),
        state: faker.location.state(),
        number: faker.string.numeric(),
        complement: faker.string.sample(),
      };

      const [, error] = await subscriber_service.updateSubscriberAddress(params);

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("updates a the subscriber address", async () => {
      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(
        new Subscriber({
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
        })
      );

      const params = {
        subscriber_id: faker.string.uuid(),
        street: faker.location.street(),
        district: faker.location.secondaryAddress(),
        state: faker.location.state(),
        number: faker.string.numeric(),
        complement: faker.string.sample(),
      };

      const [, error] = await subscriber_service.updateSubscriberAddress(params);

      expect(error).toBeUndefined();
      expect(subscriber_repository_mock.getSubcriberById).toHaveBeenCalledTimes(1);
      const subscriber = subscriber_repository_mock.updateSubscriber.mock.calls[0][0].toObject();
      expect(subscriber.address).toEqual({
        street: params.street,
        district: params.district,
        state: params.state,
        number: params.number,
        complement: params.complement,
      });
    });
  });

  describe('SubscriberService.updateSubscriberPerfonalInfo', () => {
    it("returns a not found error if subscriber doesn't exist", async () => {
      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(null);

      const params = {
        subscriber_id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
      };

      const [, error] = await subscriber_service.updateSubscriberPerfonalInfo(params);

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("updates a the subscriber perfonal info", async () => {
      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(
        new Subscriber({
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
        })
      );

      const params = {
        subscriber_id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        phone_number: faker.string.numeric(11),
      };

      const [, error] = await subscriber_service.updateSubscriberPerfonalInfo(params);

      expect(error).toBeUndefined();
      expect(subscriber_repository_mock.getSubcriberById).toHaveBeenCalledTimes(1);
      const subscriber = subscriber_repository_mock.updateSubscriber.mock.calls[0][0].toObject();
      expect(subscriber.email).toEqual(params.email);
      expect(subscriber.document).toEqual(params.document);
      expect(subscriber.phone_number).toEqual(params.phone_number);
    });
  });

  describe('SubscriberService.updateSubscriberPaymentMethod', () => {
    it("returns a not found error if subscriber doesn't exist", async () => {
      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(null);

      const params = {
        subscriber_id: faker.string.uuid(),
        payment_type: faker.helpers.enumValue(PaymentTypes),
      };

      const [, error] = await subscriber_service.updateSubscriberPaymentMethod(params);

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("updates a the subscriber payment method", async () => {
      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(
        new Subscriber({
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
        })
      );

      const params = {
        subscriber_id: faker.string.uuid(),
        payment_type: PaymentTypes.PIX,
      };

      const [, error] = await subscriber_service.updateSubscriberPaymentMethod(params);

      expect(error).toBeUndefined();
      expect(subscriber_repository_mock.getSubcriberById).toHaveBeenCalledTimes(1);
      const subscriber = subscriber_repository_mock.updateSubscriber.mock.calls[0][0].toObject();
      expect(subscriber.payment_method).toEqual({
        payment_type: params.payment_type,
        credit_card_external_id: undefined,
      });
    });

    it("should register the credit card external before save if payment type is equal to 'credit_card'", async () => {
      const credit_card_external_id = faker.string.uuid();
      mediator_mock.send.mockResolvedValueOnce(credit_card_external_id);

      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(
        new Subscriber({
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
        })
      );

      const params = {
        subscriber_id: faker.string.uuid(),
        payment_type: PaymentTypes.CREDIT_CARD,
        credit_card_token: faker.string.uuid(),
      };

      const [, error] = await subscriber_service.updateSubscriberPaymentMethod(params);

      expect(error).toBeUndefined();
      expect(subscriber_repository_mock.getSubcriberById).toHaveBeenCalledTimes(1);
      expect(mediator_mock.send).toHaveBeenCalledTimes(1);
      expect(mediator_mock.send.mock.calls[0][0]).toBeInstanceOf(SaveCreditCardCommand);
      const subscriber = subscriber_repository_mock.updateSubscriber.mock.calls[0][0].toObject();
      expect(subscriber.payment_method).toEqual({
        payment_type: params.payment_type,
        credit_card_external_id,
      });
    });

    it("should return a CreditCardError if it was not possible to complet the credit card registration", async () => {
      mediator_mock.send.mockRejectedValueOnce(new CreditCardError('test'));

      subscriber_repository_mock.getSubcriberById.mockResolvedValueOnce(
        new Subscriber({
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
        })
      );

      const params = {
        subscriber_id: faker.string.uuid(),
        payment_type: PaymentTypes.CREDIT_CARD,
        credit_card_token: faker.string.uuid(),
      };

      const [, error] = await subscriber_service.updateSubscriberPaymentMethod(params);

      expect(error).toBeInstanceOf(CreditCardError);
    });
  });
});
