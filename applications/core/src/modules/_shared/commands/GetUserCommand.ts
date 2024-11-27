import Command from "@shared/Command";

export default class GetUserCommand extends Command {
  constructor(readonly user_id: string) {
    super();
  }
}
