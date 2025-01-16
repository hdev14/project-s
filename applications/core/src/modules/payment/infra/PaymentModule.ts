import PaymentGateway from "@payment/app/PaymentGateway";
import PaymentService from "@payment/app/PaymentService";
import SaveCreditCardCommandHandler from "@payment/app/SaveCreditCardCommandHandler";
import SaveCreditCardCommand from "@shared/commands/SaveCreditCardCommand";
import Consumer from "@shared/Consumer";
import Mediator from "@shared/Mediator";
import Module from "@shared/Module";
import types from "@shared/types";
import { Job, Processor } from "bullmq";
import { ContainerModule, interfaces } from "inversify";
import FakePaymentGateway from "./external/FakePaymentGateway";
import MercadoPago from "./external/MercadoPago";
import './http/PaymentController';
import DbPaymentRepository from "./persistence/DbPaymentRepository";
import PaymentLogRepository from "@payment/app/PaymentLogRepository";
import PaymentRepository from "@payment/app/PaymentRepository";
import DbPaymentLogRepository from "./persistence/DbPaymentLogRepository";

export default class PaymentModule implements Module {
  init(): ContainerModule {
    const module = new ContainerModule((bind, _unbind, _isBound, _rebind, _unbindAsync, onActivation) => {
      const payment_gateway = (process.env.NODE_ENV !== 'test' || process.env.ENABLE_PAYMENT_GATEWAY === 'true')
        ? new MercadoPago()
        : new FakePaymentGateway();
      bind<PaymentGateway>(types.PaymentGateway).toConstantValue(payment_gateway);
      bind<PaymentRepository>(types.PaymentRepository).to(DbPaymentRepository).inSingletonScope();
      bind<PaymentLogRepository>(types.PaymentLogRepository).to(DbPaymentLogRepository).inSingletonScope();
      bind<PaymentService>(types.PaymentService)
        .to(PaymentService)
        .onActivation((context, payment_service) => {
          const PaymentConsumer = context.container.get<interfaces.Newable<Consumer<Parameters<Processor>>>>(types.NewableConsumer);

          new PaymentConsumer({
            queue_name: process.env.PAYMENT_QUEUE,
            handler: async (job: Job<any, any, string>, token?: string) => {
              console.log(job);
              console.log(token);
              await payment_service.createPayment({
                subscription_id: job.data.subscription_id,
                customer_id: job.data.subscriber_id,
                tenant_id: job.data.tenant_id,
                amount: job.data.amount,
              });
            }
          });

          return payment_service;
        });

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
