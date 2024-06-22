import AccessPlanRepository from '@auth/app/AccessPlanRepository';
import AuthService from "@auth/app/AuthService";
import AuthTokenManager from "@auth/app/AuthTokenManager";
import Encryptor from "@auth/app/Encryptor";
import PolicyRepository from "@auth/app/PolicyRepository";
import UserRepository from "@auth/app/UserRepository";
import AccessPlan, { AccessPlanTypes } from '@auth/domain/AccessPlan';
import Policy from '@auth/domain/Policy';
import User from '@auth/domain/User';
import { faker } from '@faker-js/faker/locale/pt_BR';
import CredentialError from '@shared/errors/CredentialError';
import NotFoundError from '@shared/errors/NotFoundError';
import { mock } from 'jest-mock-extended';

describe('AuthService unit tests', () => {
  const user_repository_mock = mock<UserRepository>();
  const encryptor_mock = mock<Encryptor>();
  const auth_token_manager_mock = mock<AuthTokenManager>();
  const policy_repository_mock = mock<PolicyRepository>();
  const access_plan_repository_mock = mock<AccessPlanRepository>();

  const auth_service = new AuthService(
    encryptor_mock,
    auth_token_manager_mock,
    user_repository_mock,
    policy_repository_mock,
    access_plan_repository_mock,
  );

  describe('AuthService.login', () => {
    it("returns a not found error if user doesn't exist", async () => {
      user_repository_mock.getUserByEmail.mockResolvedValueOnce(null);

      const [data, error] = await auth_service.login({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('Usuário não encontrado');
    });

    it("returns a credentials error if password is invalid", async () => {
      user_repository_mock.getUserByEmail.mockResolvedValueOnce(new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: []
      }));

      encryptor_mock.compareHash.mockReturnValueOnce(false);

      const [data, error] = await auth_service.login({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(CredentialError);
      expect(error!.message).toEqual('Credenciais inválidas');
    });

    it("returns a login result if credentials are valid", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: []
      });

      user_repository_mock.getUserByEmail.mockResolvedValueOnce(user);
      encryptor_mock.compareHash.mockReturnValueOnce(true);
      auth_token_manager_mock.generateToken.mockReturnValueOnce({
        token: 'test',
        expired_at: new Date(),
      });

      const [data, error] = await auth_service.login({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(error).toBeUndefined();
      expect(data!.user).toEqual(user.toObject())
      expect(data!.auth.token).toEqual('test');
      expect(data!.auth.expired_at).toBeInstanceOf(Date);
    });
  });

  describe('AuthService.registerUser', () => {
    it('should register a new user', async () => {
      encryptor_mock.createHash.mockReturnValueOnce('test');

      const [data, error] = await auth_service.registerUser({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.password).toEqual('test');
    });

    it("returns a not found error when access_plan_id is passed and access plan doesn't exist", async () => {
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(null);

      const [data, error] = await auth_service.registerUser({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        access_plan_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('Plano de acesso não encontrado');
    });
  });

  describe('AuthService.updateUser', () => {
    it("returns a not found error if user doesn't exist", async () => {
      user_repository_mock.getUserById.mockResolvedValueOnce(null);

      const [data, error] = await auth_service.updateUser({
        user_id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('Usuário não encontrado');
    });

    it("updates an user", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: []
      });

      user_repository_mock.getUserById.mockResolvedValueOnce(user);
      encryptor_mock.createHash.mockReturnValueOnce('test');

      const [, error] = await auth_service.updateUser({
        user_id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(error).toBeUndefined();
      expect(user_repository_mock.updateUser).toHaveBeenCalledTimes(1);
    });

    it("updates only email", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: []
      });

      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      const email = faker.internet.email();
      const [, error] = await auth_service.updateUser({
        user_id: faker.string.uuid(),
        email,
      });

      expect(error).toBeUndefined();
      expect(user_repository_mock.updateUser).toHaveBeenCalledTimes(1);
      const param = user_repository_mock.updateUser.mock.calls[0][0].toObject();
      expect(param.email).toEqual(email);
      expect(param.password).not.toEqual('test');
      expect(encryptor_mock.createHash).not.toHaveBeenCalled();
    });

    it("updates only password", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: []
      });

      user_repository_mock.getUserById.mockResolvedValueOnce(user);
      encryptor_mock.createHash.mockReturnValueOnce('test');

      const [, error] = await auth_service.updateUser({
        user_id: faker.string.uuid(),
        password: faker.string.alphanumeric(),
      });

      expect(error).toBeUndefined();
      expect(user_repository_mock.updateUser).toHaveBeenCalledTimes(1);
      const param = user_repository_mock.updateUser.mock.calls[0][0].toObject();
      expect(param.password).toEqual('test');
      expect(encryptor_mock.createHash).toHaveBeenCalled();
    });
  });

  describe('AuthService.updatePolicies', () => {
    it("returns a not found error if user doesn't exist", async () => {
      user_repository_mock.getUserById.mockResolvedValueOnce(null);

      const [data, error] = await auth_service.updatePolicies({
        user_id: faker.string.uuid(),
        policy_slugs: [],
        mode: 'attach',
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('Usuário não encontrado');
    });

    it("should attach policies", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: []
      });

      const attach_policy_spy = jest.spyOn(user, 'attachPolicy');

      policy_repository_mock.getPolicies.mockResolvedValueOnce([
        new Policy({
          id: faker.string.uuid(),
          slug: faker.word.verb(),
        }),
        new Policy({
          id: faker.string.uuid(),
          slug: faker.word.verb(),
        }),
      ]);
      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      const [, error] = await auth_service.updatePolicies({
        user_id: faker.string.uuid(),
        policy_slugs: [faker.word.verb(), faker.word.verb()],
        mode: 'attach'
      });

      expect(error).toBeUndefined()
      expect(attach_policy_spy).toHaveBeenCalledTimes(2);
      expect(user_repository_mock.updateUser).toHaveBeenCalledTimes(1);
    });

    it("should dettach policies", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: []
      });

      const dettach_policy_spy = jest.spyOn(user, 'dettachPolicy');

      policy_repository_mock.getPolicies.mockResolvedValueOnce([
        new Policy({
          id: faker.string.uuid(),
          slug: faker.word.verb(),
        }),
        new Policy({
          id: faker.string.uuid(),
          slug: faker.word.verb(),
        }),
      ]);
      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      const [, error] = await auth_service.updatePolicies({
        user_id: faker.string.uuid(),
        policy_slugs: [faker.word.verb(), faker.word.verb()],
        mode: 'dettach'
      });

      expect(error).toBeUndefined()
      expect(dettach_policy_spy).toHaveBeenCalledTimes(2);
      expect(user_repository_mock.updateUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('AuthService.getUsers', () => {
    it('returns a list of users', async () => {
      user_repository_mock.getUsers.mockResolvedValueOnce([
        new User({
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(),
          policies: []
        }),
        new User({
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(),
          policies: []
        }),
      ]);

      const [data, error] = await auth_service.getUsers({});

      expect(error).toBeUndefined();
      expect(data![0]).not.toBeInstanceOf(User);
      expect(data).toHaveLength(2);
    });
  });

  describe('AuthService.changeAccessPlan', () => {
    it("returns a not found error if access plan doesn't exist", async () => {
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(null);

      const [data, error] = await auth_service.changeAccessPlan({
        user_id: faker.string.uuid(),
        access_plan_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('Plano de acesso não encontrado');
    });

    it("returns a not found error if user doesn't exist", async () => {
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(new AccessPlan({
        id: faker.string.uuid(),
        active: faker.datatype.boolean(),
        amount: faker.number.float(),
        type: AccessPlanTypes.ANNUALLY,
      }));

      user_repository_mock.getUserById.mockResolvedValueOnce(null);

      const [data, error] = await auth_service.changeAccessPlan({
        user_id: faker.string.uuid(),
        access_plan_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('Usuário não encontrado');
    });

    it("should update user access plan", async () => {
      const access_plan = new AccessPlan({
        id: faker.string.uuid(),
        active: faker.datatype.boolean(),
        amount: faker.number.float(),
        type: AccessPlanTypes.ANNUALLY,
      });

      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(access_plan);

      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
      });

      const change_access_plan_spy = jest.spyOn(user, 'changeAccessPlan');

      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      const [, error] = await auth_service.changeAccessPlan({
        user_id: faker.string.uuid(),
        access_plan_id: faker.string.uuid(),
      });

      expect(error).toBeUndefined();
      expect(change_access_plan_spy).toHaveBeenCalledWith(access_plan);
      expect(user_repository_mock.updateUser).toHaveBeenCalledTimes(1);
    });
  })
});