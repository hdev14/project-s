import { AddressValue } from "@shared/Address";
import Either from "@shared/utils/Either";
import { PaymentMethodValue } from "@subscriber/domain/PaymentMethod";
import { SubscriberObject } from "@subscriber/domain/Subscriber";

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
  async getSubscriber(params: GetSubscriberParams): Promise<Either<SubscriberObject>> {
    return Either.left(new Error());
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
