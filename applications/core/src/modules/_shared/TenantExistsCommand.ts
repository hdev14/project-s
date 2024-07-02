import Command from "@shared/Command";

export default class TenantExistsCommand extends Command {
  constructor(readonly tenant_id: string) {
    super();
  }
}