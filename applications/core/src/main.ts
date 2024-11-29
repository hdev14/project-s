import AuthModule from "@auth/infra/AuthModule";
import CatalogModule from "@catalog/infra/CatalogModule";
import CompanyModule from "@company/infra/CompanyModule";
import Logger from "@global/app/Logger";
import GlobalModule from "@global/infra/GlobalModule";
import PaymentModule from "@payment/infra/PaymentModule";
import Database from "@shared/Database";
import Scheduler from "@shared/Scheduler";
import types from "@shared/types";
import SubscriberModule from "@subscriber/infra/SubscriberModule";
import SubscriptionModule from "@subscription/infra/SubscriptionModule";
import process from "process";
import Application from "./Application";

(async function main() {
  const scheduler = Scheduler.getInstance();

  try {
    Database.connect();

    const application = new Application({
      modules: [
        new GlobalModule(),
        new AuthModule(),
        new CatalogModule(),
        new CompanyModule(),
        new SubscriberModule(),
        new PaymentModule(),
        new SubscriptionModule()
      ]
    });

    const logger = application.container.get<Logger>(types.Logger);

    scheduler.start();

    const server_instance = application.server.listen(process.env.SERVER_PORT, () => {
      logger.info('Server is running!');
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      server_instance.close(() => {
        logger.info('Http server closed!');
      });
    });
  } catch (error) {
    console.error(error);
    scheduler.stop();
    await Database.disconnect();
  }
})();
