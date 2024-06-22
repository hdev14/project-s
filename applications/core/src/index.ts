import AuthModule from "@auth/infra/AuthModule";
import Database from "@shared/Database";
import Application from "./Application";

(async function main() {
  try {
    Database.connect();
    const application = new Application({ modules: [new AuthModule()] });
    application.server.listen(process.env.SERVER_PORT, () => {
      console.log('Server is running!');
    });
  } catch (error) {
    console.error(error);
    await Database.disconnect();
  }
})();