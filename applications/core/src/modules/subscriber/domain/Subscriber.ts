import Address, { AddressValue } from "@shared/Address";
import Aggregate, { AggregateRoot, RequiredId } from "@shared/ddd/Aggregate";
import PaymentMethod, { PaymentMethodValue } from "./PaymentMethod";
import Subscription, { SubscriptionObject } from "./Subscription";

export type SubscriberObject = {
  id?: string;
  email: string;
  document: string;
  phone_number: string;
  address: AddressValue;
  subscriptions: Array<SubscriptionObject>;
  payment_method: PaymentMethodValue;
};

export default class Subscriber extends Aggregate<SubscriberObject> implements AggregateRoot {
  #document: string;
  #email: string;
  #phone_number: string;
  #address: Address;
  #subscriptions: Array<Subscription> = [];
  #payment_method: PaymentMethod;

  constructor(obj: SubscriberObject) {
    super(obj.id);
    this.#document = obj.document;
    this.#email = obj.email;
    this.#phone_number = obj.phone_number;
    this.#address = new Address(
      obj.address.street,
      obj.address.district,
      obj.address.state,
      obj.address.number,
      obj.address.complement
    );
    this.#payment_method = new PaymentMethod(
      obj.payment_method.payment_type,
      obj.payment_method.credit_card_external_id
    );
    for (let idx = 0; idx < obj.subscriptions.length; idx++) {
      this.#subscriptions.push(new Subscription(obj.subscriptions[idx]));
    }
  }

  changePersonalInfo(personal_info: Pick<SubscriberObject, 'document' | 'email' | 'phone_number'>) {
    this.#document = personal_info.document;
    this.#email = personal_info.email;
    this.#phone_number = personal_info.phone_number;
  }

  changeAddress(address: Address) {
    this.#address = address;
  }

  changePaymentMethod(payment_method: PaymentMethod) {
    this.#payment_method = payment_method;
  }

  toObject(): RequiredId<SubscriberObject> {
    const subscriptions = [];

    for (let idx = 0; idx < this.#subscriptions.length; idx++) {
      subscriptions.push(this.#subscriptions[idx].toObject());
    }

    return {
      id: this.id,
      document: this.#document,
      email: this.#email,
      phone_number: this.#phone_number,
      address: this.#address,
      payment_method: this.#payment_method,
      subscriptions,
    };
  }
}
