import AccessPlanRepository from "@auth/app/AccessPlanRepository";
import CreateUserCommandHandler from "@auth/app/CreateUserCommandHandler";
import Encryptor from "@auth/app/Encryptor";
import UserRepository from "@auth/app/UserRepository";
import AccessPlan, { AccessPlanTypes } from "@auth/domain/AccessPlan";
import User from "@auth/domain/User";
import { faker } from '@faker-js/faker/locale/pt_BR';
import CreateUserCommand from "@shared/commands/CreateUserCommand";
import NotFoundError from "@shared/errors/NotFoundError";
import { Policies } from "@shared/infra/Principal";
import UserTypes from "@shared/UserTypes";
import { mock } from "jest-mock-extended";

describe('CreateUserCommandHandler unit tests', () => {
  const user_repository_mock = mock<UserRepository>();
  const encryptor_mock = mock<Encryptor>();
  const access_plan_repository_mock = mock<AccessPlanRepository>();

  const handler = new CreateUserCommandHandler(
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

    const command = new CreateUserCommand({
      access_plan_id: faker.string.uuid(),
      default_policies: [Policies.LIST_USERS],
      email: faker.internet.email(),
      temp_password: faker.string.sample(),
      type: faker.helpers.enumValue(UserTypes),
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
    expect(obj.type).toEqual(command.type);
  });

  it('should create a new regular user', async () => {
    encryptor_mock.createHash.mockReturnValueOnce('test');

    const command = new CreateUserCommand({
      default_policies: [Policies.LIST_USERS],
      email: faker.internet.email(),
      temp_password: faker.string.sample(),
      tenant_id: faker.string.uuid(),
      type: faker.helpers.enumValue(UserTypes),
    });

    const user_id = await handler.handle(command);

    expect(user_id).toBeTruthy();
    expect(encryptor_mock.createHash).toHaveBeenCalledWith(command.temp_password);
    expect(user_repository_mock.createUser).toHaveBeenCalled();
    const param = user_repository_mock.createUser.mock.calls[0][0];
    expect(param).toBeInstanceOf(User);
    const obj = param.toObject();
    expect(obj.email).toEqual(command.email);
    expect(obj.password).toEqual('test');
    expect(obj.tenant_id).toEqual(command.tenant_id);
    expect(obj.policies).toEqual(command.default_policies);
    expect(obj.type).toEqual(command.type);
  });

  it("should throw a not found error if access plan doesn't exist", async () => {
    access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(null);

    const command = new CreateUserCommand({
      access_plan_id: faker.string.uuid(),
      default_policies: [Policies.LIST_USERS],
      email: faker.internet.email(),
      temp_password: faker.string.sample(),
      type: faker.helpers.enumValue(UserTypes),
    });

    try {
      await handler.handle(command);
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
    }
  });
});
