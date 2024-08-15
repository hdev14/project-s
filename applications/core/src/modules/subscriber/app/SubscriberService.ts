import Address, { AddressValue } from "@shared/Address";
import SaveCreditCardCommand from "@shared/commands/SaveCreditCardCommand";
import CreditCardError from "@shared/errors/CreditCardError";
import NotFoundError from "@shared/errors/NotFoundError";
import Mediator from "@shared/Mediator";
import Either from "@shared/utils/Either";
import PaymentMethod, { PaymentTypes } from "@subscriber/domain/PaymentMethod";
import { SubscriberObject } from "@subscriber/domain/Subscriber";
import SubscriberRepository from "./SubscriberRepository";

export type GetSubscriberParams = {
  subscriber_id: string;
};

export type CreateSubscriberParams = {
  email: string;
  document: string;
  phone_number: string;
  address: AddressValue;
};

export type UpdateSubscriberAddressParams = {
  subscriber_id: string;
} & AddressValue;

export type UpdateSubscriberPersonalInfoParams = {
  subscriber_id: string;
  email: string;
  document: string;
  phone_number: string;
};

type UpdateSubscriberPaymentMethod = {
  subscriber_id: string;
  payment_type: PaymentTypes,
  credit_card_token?: string;
};

export default class SubscriberService {
  #subscriber_repository: SubscriberRepository;
  #mediator: Mediator;

  constructor(subscriber_repository: SubscriberRepository, mediator: Mediator) {
    this.#subscriber_repository = subscriber_repository;
    this.#mediator = mediator;
  }

  async getSubscriber(params: GetSubscriberParams): Promise<Either<SubscriberObject>> {
    const subscriber = await this.#subscriber_repository.getSubcriberById(params.subscriber_id);

    if (!subscriber) {
      return Either.left(new NotFoundError('notfound.subscriber'));
    }

    return Either.right(subscriber.toObject());
  }

  async createSubscriber(params: CreateSubscriberParams): Promise<Either<SubscriberObject>> {
    return Either.left(new Error());
  }

  async updateSubscriberAddress(params: UpdateSubscriberAddressParams): Promise<Either<void>> {
    const subscriber = await this.#subscriber_repository.getSubcriberById(params.subscriber_id);

    if (!subscriber) {
      return Either.left(new NotFoundError('notfound.subscriber'));
    }

    subscriber.changeAddress(
      new Address(
        params.street,
        params.district,
        params.state,
        params.number,
        params.complement
      )
    );

    await this.#subscriber_repository.updateSubscriber(subscriber);

    return Either.right();
  }

  async updateSubscriberPerfonalInfo(params: UpdateSubscriberPersonalInfoParams): Promise<Either<void>> {
    const subscriber = await this.#subscriber_repository.getSubcriberById(params.subscriber_id);

    if (!subscriber) {
      return Either.left(new NotFoundError('notfound.subscriber'));
    }

    subscriber.changePersonalInfo({
      document: params.document,
      email: params.email,
      phone_number: params.phone_number,
    });

    await this.#subscriber_repository.updateSubscriber(subscriber);

    return Either.right();
  }

  async updateSubscriberPaymentMethod(params: UpdateSubscriberPaymentMethod): Promise<Either<void>> {

    try {
      const subscriber = await this.#subscriber_repository.getSubcriberById(params.subscriber_id);

      if (!subscriber) {
        return Either.left(new NotFoundError('notfound.subscriber'));
      }

      let credit_card_external_id: string | undefined;

      const subscriber_obj = subscriber.toObject();

      if (params.payment_type === PaymentTypes.CREDIT_CARD) {
        credit_card_external_id = await this.#mediator.send<string>(new SaveCreditCardCommand({
          customer_id: subscriber_obj.id,
          document: subscriber_obj.document,
          email: subscriber_obj.email,
          address: subscriber_obj.address,
          credit_card_token: params.credit_card_token!,
        }));
      }

      subscriber.changePaymentMethod(
        new PaymentMethod(params.payment_type, credit_card_external_id)
      );

      await this.#subscriber_repository.updateSubscriber(subscriber);

      return Either.right();
    } catch (error) {
      if (error instanceof CreditCardError) {
        return Either.left(error);
      }

      throw error;
    }
  }
}
