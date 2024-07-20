import AccessPlanRepository from "@auth/app/AccessPlanRepository";
import CreateTenantUserCommandHandler from "@auth/app/CreateTenantUserCommandHandler";
import Encryptor from "@auth/app/Encryptor";
import UserRepository from "@auth/app/UserRepository";
import AccessPlan, { AccessPlanTypes } from "@auth/domain/AccessPlan";
import User from "@auth/domain/User";
import { faker } from '@faker-js/faker/locale/pt_BR';
import CreateTenantUserCommand from "@shared/commands/CreateTenantUserCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import { Policies } from "@shared/infra/Principal";
import { mock } from "jest-mock-extended";

describe('CreateTenantUserCommandHandler unit tests', () => {
  const user_repository_mock = mock<UserRepository>();
  const encryptor_mock = mock<Encryptor>();
  const access_plan_repository_mock = mock<AccessPlanRepository>();

  const handler = new CreateTenantUserCommandHandler(
    user_repository_mock,
    encryptor_mock,
    access_plan_repository_mock,
  );

  it('should create a new tenant user', async () => {
    access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(
      new AccessPlan({
        active: faker.datatype.boolean(),
        amount: faker.number.float(),
        type: faker.helpers.enumValue(AccessPlanTypes),
        description: faker.lorem.lines(),
      })
    );

    encryptor_mock.createHash.mockReturnValueOnce('test');

    const command = new CreateTenantUserCommand({
      access_plan_id: faker.string.uuid(),
      default_policies: [Policies.LIST_USERS],
      email: faker.internet.email(),
      temp_password: faker.string.sample(),
    });

    const tenant_id = await handler.handle(command);

    expect(tenant_id).toBeTruthy();
    expect(encryptor_mock.createHash).toHaveBeenCalledWith(command.temp_password);
    expect(user_repository_mock.createUser).toHaveBeenCalled();
    const param = user_repository_mock.createUser.mock.calls[0][0];
    expect(param).toBeInstanceOf(User);
    const obj = param.toObject();
    expect(obj.email).toEqual(command.email);
    expect(obj.password).toEqual('test');
    expect(obj.access_plan_id).toEqual(command.access_plan_id);
    expect(obj.policies).toEqual(command.default_policies);
  });

  it("should throw a not found error if access plan doesn't exist", async () => {
    access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(null);

    const command = new CreateTenantUserCommand({
      access_plan_id: faker.string.uuid(),
      default_policies: [Policies.LIST_USERS],
      email: faker.internet.email(),
      temp_password: faker.string.sample(),
    });

    try {
      await handler.handle(command);
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
    }
  });
});