import AuthModule from "@auth/infra/AuthModule";
import Database from "@shared/Database";
import Application from "./Application";

(async function main() {
  try {
    Database.connect();
    const server = new Application({ modules: [new AuthModule()] });
    server.server.listen(process.env.SERVER_PORT, () => {
      console.log('Server is running!');
    });
  } catch (error) {
    await Database.disconnect();
  }
})();