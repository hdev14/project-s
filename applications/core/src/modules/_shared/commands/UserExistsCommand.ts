import Command from "@shared/Command";

export default class UserExistsCommand extends Command {
  constructor(readonly user_id: string) {
    super();
  }
}