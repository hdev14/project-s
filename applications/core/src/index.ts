import AuthModule from "@auth/infra/AuthModule";
import CatalogModule from "@catalog/infra/CatalogModule";
import CompanyModule from "@company/infra/CompanyModule";
import Database from "@shared/infra/Database";
import SharedModule from "@shared/infra/SharedModule";
import SubscriberModule from "@subscriber/infra/SubscriberModule";
import Application from "./Application";

(async function main() {
  try {
    Database.connect();
    const application = new Application({
      modules: [
        new SharedModule(),
        new AuthModule(),
        new CatalogModule(),
        new CompanyModule(),
        new SubscriberModule(),
      ]
    });
    application.server.listen(process.env.SERVER_PORT, () => {
      console.log('Server is running!');
    });
  } catch (error) {
    console.error(error);
    await Database.disconnect();
  }
})();
