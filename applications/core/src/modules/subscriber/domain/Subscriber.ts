import Address, { AddressValue } from "@shared/Address";
import Aggregate, { AggregateProps, AggregateRoot, RequiredProps } from "@shared/ddd/Aggregate";
import PaymentMethod, { PaymentMethodValue } from "./PaymentMethod";
import Subscription, { SubscriptionProps } from "./Subscription";

export type SubscriberProps = AggregateProps<{
  id?: string;
  email: string;
  document: string;
  phone_number: string;
  address: AddressValue;
  subscriptions: Array<SubscriptionProps>;
  payment_method: PaymentMethodValue;
}>;

export default class Subscriber extends Aggregate<SubscriberProps> implements AggregateRoot {
  #document: string;
  #email: string;
  #phone_number: string;
  #address: Address;
  #subscriptions: Array<Subscription> = [];
  #payment_method: PaymentMethod;

  constructor(props: SubscriberProps) {
    super(props);
    this.#document = props.document;
    this.#email = props.email;
    this.#phone_number = props.phone_number;
    this.#address = new Address(
      props.address.street,
      props.address.district,
      props.address.state,
      props.address.number,
      props.address.complement
    );
    this.#payment_method = new PaymentMethod(
      props.payment_method.payment_type,
      props.payment_method.credit_card_external_id
    );
    for (let idx = 0; idx < props.subscriptions.length; idx++) {
      this.#subscriptions.push(new Subscription(props.subscriptions[idx]));
    }
  }

  changePersonalInfo(personal_info: Pick<SubscriberProps, 'document' | 'email' | 'phone_number'>) {
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

  toObject(): RequiredProps<SubscriberProps> {
    const subscriptions = [];

    for (let idx = 0; idx < this.#subscriptions.length; idx++) {
      subscriptions.push(this.#subscriptions[idx].toObject());
    }

    return {
      id: this.id,
      document: this.#document,
      email: this.#email,
      phone_number: this.#phone_number,
      address: this.#address.value,
      payment_method: this.#payment_method.value,
      subscriptions,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
