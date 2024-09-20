import EmailService from "@global/app/EmailService";
import Address, { AddressValue } from "@shared/Address";
import CreateUserCommand from "@shared/commands/CreateUserCommand";
import SaveCreditCardCommand from "@shared/commands/SaveCreditCardCommand";
import CreditCardError from "@shared/errors/CreditCardError";
import NotFoundError from "@shared/errors/NotFoundError";
import Mediator from "@shared/Mediator";
import types from "@shared/types";
import UserTypes from "@shared/UserTypes";
import Either from "@shared/utils/Either";
import PaymentMethod, { PaymentTypes } from "@subscriber/domain/PaymentMethod";
import Subscriber, { SubscriberProps } from "@subscriber/domain/Subscriber";
import { inject, injectable } from "inversify";
import 'reflect-metadata';
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

@injectable()
export default class SubscriberService {
  #subscriber_repository: SubscriberRepository;
  #mediator: Mediator;
  #email_service: EmailService;

  constructor(
    @inject(types.SubscriberRepository) subscriber_repository: SubscriberRepository,
    @inject(types.Mediator) mediator: Mediator,
    @inject(types.EmailService) email_service: EmailService,
  ) {
    this.#subscriber_repository = subscriber_repository;
    this.#mediator = mediator;
    this.#email_service = email_service;
  }

  async getSubscriber(params: GetSubscriberParams): Promise<Either<SubscriberProps>> {
    const subscriber = await this.#subscriber_repository.getSubcriberById(params.subscriber_id);

    if (!subscriber) {
      return Either.left(new NotFoundError('notfound.subscriber'));
    }

    return Either.right(subscriber.toObject());
  }

  async createSubscriber(params: CreateSubscriberParams): Promise<Either<SubscriberProps>> {
    const user_id = await this.#mediator.send<string>(new CreateUserCommand({
      default_policies: [],
      email: params.email,
      temp_password: params.document.slice(0, 6),
      type: UserTypes.CUSTOMER,
    }));

    const subscriber = new Subscriber({
      id: user_id,
      document: params.document,
      email: params.email,
      phone_number: params.phone_number,
      address: params.address,
      payment_method: { payment_type: PaymentTypes.PIX },
      subscriptions: []
    });

    await this.#subscriber_repository.updateSubscriber(subscriber);

    await this.#email_service.send({
      email: params.email,
      message: 'Para efetuar o primeiro acesso a plataforma utilize como senha os primeiros 6 digitos do CPF.',
      title: 'Cliente cadastrado!'
    });

    return Either.right(subscriber.toObject());
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
        credit_card_external_id = await this.#mediator.send<string>(
          new SaveCreditCardCommand({
            customer_id: subscriber_obj.id,
            document: subscriber_obj.document,
            email: subscriber_obj.email,
            credit_card_token: params.credit_card_token!,
          })
        );
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
