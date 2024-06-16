import Aggregate, { AggregateRoot, RequiredId } from "@share/ddd/Aggregate";
import Address, { AddressValue } from "./Address";
import PaymentMethod, { PaymentMethodValue } from "./PaymentMethod";
import Subscription, { SubscriptionObject } from "./Subscription";

export type SubscriberObject = {
  id?: string;
  document: string;
  address: AddressValue;
  subscriptions: Array<SubscriptionObject>;
  payment_method: PaymentMethodValue;
};

export default class Subscriber extends Aggregate<SubscriberObject> implements AggregateRoot {
  #document: string;
  #address: Address;
  #subscriptions: Array<Subscription> = [];
  #payment_method: PaymentMethod

  constructor(obj: SubscriberObject) {
    super(obj.id);
    this.#document = obj.document;
    this.#address = new Address(
      obj.address.state,
      obj.address.street,
      obj.address.district,
      obj.address.number,
      obj.address.complement
    );
    this.#payment_method = new PaymentMethod(obj.payment_method.payment_type, obj.payment_method.credit_card_id);
    for (let idx = 0; idx < obj.subscriptions.length; idx++) {
      this.#subscriptions.push(new Subscription(obj.subscriptions[idx]));
    }
  }

  toObject(): RequiredId<SubscriberObject> {
    const subscriptions = [];

    for (let idx = 0; idx < this.#subscriptions.length; idx++) {
      subscriptions.push(this.#subscriptions[idx].toObject());
    }

    return {
      id: this.id,
      document: this.#document,
      address: this.#address,
      payment_method: this.#payment_method,
      subscriptions,
    };
  }
}