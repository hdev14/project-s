import Command from "@shared/Command";

type CreateTenantUserCommandParams = {
  email: string;
  temp_password: string;
  access_plan_id: string;
  default_policies: string[];
};

export default class CreateTenantUserCommand extends Command {
  readonly email: string;
  readonly temp_password: string;
  readonly access_plan_id: string;
  readonly default_policies: string[];

  constructor(params: CreateTenantUserCommandParams) {
    super();
    this.email = params.email;
    this.temp_password = params.temp_password;
    this.access_plan_id = params.access_plan_id;
    this.default_policies = params.default_policies;
  }
}