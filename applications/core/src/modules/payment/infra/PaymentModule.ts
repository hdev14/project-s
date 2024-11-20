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
      // TODO
      // onActivation<PaymentService>(types.PaymentService, (context, payment_service) => {
      //   const PaymentConsumer = context.container.get<interfaces.Newable<Consumer<Parameters<Processor>>>>(types.NewableConsumer);

      //   new PaymentConsumer({
      //     queue_name: process.env.PAYMENT_QUEUE,
      //     handler: async (job: Job<any, any, string>, token?: string) => {
      //       console.log(job);
      //       console.log(token);
      //       await payment_service.createPayment({
      //         subscription_id: job.data.subscription_id,
      //         customer_id: job.data.subscriber_id,
      //         tenant_id: job.data.tenant_id,
      //         amount: job.data.amount,
      //       });
      //     }
      //   });

      //   return payment_service;
      // });
    });

    return module;
  }
}
