import { AddressValue } from "@shared/Address";
import NotFoundError from "@shared/errors/NotFoundError";
import Either from "@shared/utils/Either";
import { PaymentMethodValue } from "@subscriber/domain/PaymentMethod";
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

export type UpdateAddressParams = {
  subscriber_id: string;
} & AddressValue;

export type UpdatePersonalInfoParams = {
  subscriber_id: string;
  email: string;
  document: string;
  phone_number: string;
};

type UpdatePaymentMethod = {
  subscriber_id: string;
} & PaymentMethodValue;

export default class SubscriberService {
  #subscriber_repository: SubscriberRepository;

  constructor(subscriber_repository: SubscriberRepository) {
    this.#subscriber_repository = subscriber_repository;
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

  async updateAddress(params: UpdateAddressParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async updatePersonalInfo(params: UpdatePersonalInfoParams): Promise<Either<void>> {
    return Either.left(new Error());
  }

  async updatePaymentMethod(params: UpdatePaymentMethod): Promise<Either<void>> {
    return Either.left(new Error());
  }
}
