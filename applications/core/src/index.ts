import Database from "@shared/Database";
import Server from "./Server";

(async function main() {
  try {
    Database.connect();
    const server = new Server();
    server.application.listen(process.env.SERVER_PORT, () => {
      console.log('Server is running!');
    });
  } catch (error) {
    await Database.disconnect();
  }
})();