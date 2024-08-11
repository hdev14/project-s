import Handler from "@shared/Handler";
import SaveCreditCardCommand from "@shared/commands/CreateCreditCardCommand";

export default class SaveCreditCardCommandHandler implements Handler<SaveCreditCardCommand, string> {
  handle(command: SaveCreditCardCommand): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
