import PaymentGateway from "@payment/app/PaymentGateway";
import SaveCreditCardCommandHandler from "@payment/app/SaveCreditCardCommandHandler";
import SaveCreditCardCommand from "@shared/commands/SaveCreditCardCommand";
import Mediator from "@shared/Mediator";
import Module from "@shared/Module";
import types from "@shared/types";
import { ContainerModule } from "inversify";
import FakePaymentGateway from "./external/FakePaymentGateway";
import MercadoPago from "./external/MercadoPago";

export default class PaymentModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind, _unbind, _isBound, _rebind, _unbindAsync, onActivation) => {
      const payment_gateway = (process.env.NODE_ENV !== 'test' || process.env.ENABLE_PAYMENT_GATEWAY === 'true')
        ? new MercadoPago()
        : new FakePaymentGateway();
      bind<PaymentGateway>(types.PaymentGateway).toConstantValue(payment_gateway);
      onActivation<Mediator>(types.Mediator, (_context, mediator) => {
        mediator.register(
          SaveCreditCardCommand.name,
          new SaveCreditCardCommandHandler(payment_gateway),
        );
        return mediator;
      });
    });

    return module;
  }
}
