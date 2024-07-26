import Command from "@shared/Command";

type CreateUserCommandParams = {
  email: string;
  temp_password: string;
  access_plan_id?: string;
  default_policies: string[];
  tenant_id?: string;
};

export default class CreateUserCommand extends Command {
  readonly email: string;
  readonly temp_password: string;
  readonly access_plan_id?: string;
  readonly default_policies: string[];
  readonly tenant_id?: string;

  constructor(params: CreateUserCommandParams) {
    super();
    this.email = params.email;
    this.temp_password = params.temp_password;
    this.access_plan_id = params.access_plan_id;
    this.default_policies = params.default_policies;
    this.tenant_id = params.tenant_id;
  }
}