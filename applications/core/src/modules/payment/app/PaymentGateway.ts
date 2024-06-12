import Payment from "@payment/domain/Payment";
import PaymentLog from "@payment/domain/PaymentLog";


// TODO
export default interface PaymentGateway {
  makeTransaction(payment: Payment): Promise<PaymentLog>;
}