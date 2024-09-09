import AuthModule from "@auth/infra/AuthModule";
import CatalogModule from "@catalog/infra/CatalogModule";
import CompanyModule from "@company/infra/CompanyModule";
import PaymentModule from "@payment/infra/PaymentModule";
import Database from "@shared/Database";
import Logger from "@shared/Logger";
import types from "@shared/types";
import SubscriberModule from "@subscriber/infra/SubscriberModule";
import Application from "./Application";

(async function main() {
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
      ]
    });

    const logger = application.container.get<Logger>(types.Logger);

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
    await Database.disconnect();
  }
})();
