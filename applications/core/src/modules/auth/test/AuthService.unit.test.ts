import AccessPlanRepository from '@auth/app/AccessPlanRepository';
import AuthService from '@auth/app/AuthService';
import AuthTokenManager from '@auth/app/AuthTokenManager';
import Encryptor from '@auth/app/Encryptor';
import PolicyRepository from '@auth/app/PolicyRepository';
import UserRepository from '@auth/app/UserRepository';
import VerificationCodeRepository from '@auth/app/VerificationCodeRepository';
import AccessPlan, { AccessPlanTypes } from '@auth/domain/AccessPlan';
import Policy from '@auth/domain/Policy';
import User from '@auth/domain/User';
import VerificationCode from '@auth/domain/VerificationCode';
import { faker } from '@faker-js/faker/locale/pt_BR';
import EmailService from '@global/app/EmailService';
import CredentialError from '@shared/errors/CredentialError';
import DomainError from '@shared/errors/DomainError';
import ExpiredCodeError from '@shared/errors/ExpiredCode';
import NotFoundError from '@shared/errors/NotFoundError';
import UserTypes from '@shared/UserTypes';
import Collection from '@shared/utils/Collection';
import Page from '@shared/utils/Page';
import { mock } from 'jest-mock-extended';

describe('AuthService unit tests', () => {
  const user_repository_mock = mock<UserRepository>();
  const encryptor_mock = mock<Encryptor>();
  const auth_token_manager_mock = mock<AuthTokenManager>();
  const policy_repository_mock = mock<PolicyRepository>();
  const access_plan_repository_mock = mock<AccessPlanRepository>();
  const verification_code_mock = mock<VerificationCodeRepository>();
  const email_service_mock = mock<EmailService>();

  const auth_service = new AuthService(
    encryptor_mock,
    auth_token_manager_mock,
    user_repository_mock,
    policy_repository_mock,
    access_plan_repository_mock,
    verification_code_mock,
    email_service_mock
  );

  describe('AuthService.login', () => {
    it("returns a credential error if user doesn't exist", async () => {
      user_repository_mock.getUserByEmail.mockResolvedValueOnce(null);

      const [error, data] = await auth_service.login({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(CredentialError);
      expect(error!.message).toEqual('credential_error');
    });

    it("returns a credentials error if password is invalid", async () => {
      user_repository_mock.getUserByEmail.mockResolvedValueOnce(new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      }));

      encryptor_mock.compareHash.mockReturnValueOnce(false);

      const [error, data] = await auth_service.login({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(CredentialError);
      expect(error!.message).toEqual('credential_error');
    });

    it("returns a login result if credentials are valid", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      });

      user_repository_mock.getUserByEmail.mockResolvedValueOnce(user);
      encryptor_mock.compareHash.mockReturnValueOnce(true);
      auth_token_manager_mock.generateToken.mockReturnValueOnce({
        token: 'test',
        expired_at: new Date(),
      });

      const [error, data] = await auth_service.login({
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

      const [error, data] = await auth_service.registerUser({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        type: faker.helpers.enumValue(UserTypes),
      });

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.password).toEqual('test');
      expect(user_repository_mock.createUser).toHaveBeenCalled();
    });

    it("returns a not found error when access_plan_id is passed and access plan doesn't exist", async () => {
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(null);

      const [error, data] = await auth_service.registerUser({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        access_plan_id: faker.string.uuid(),
        type: faker.helpers.enumValue(UserTypes),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.access_plan');
    });

    it("should register a new tenant's user", async () => {
      encryptor_mock.createHash.mockReturnValueOnce('test');

      const tenant_id = faker.string.uuid();

      user_repository_mock.getUserById.mockResolvedValueOnce(new User({
        id: tenant_id,
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      }));

      const [error, data] = await auth_service.registerUser({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        tenant_id,
        type: faker.helpers.enumValue(UserTypes),
      });

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.password).toEqual('test');
      expect(data!.tenant_id).toEqual(tenant_id);
      expect(user_repository_mock.createUser).toHaveBeenCalled();
    });

    it("return a not found erro when tenant doesn't exist", async () => {
      encryptor_mock.createHash.mockReturnValueOnce('test');

      const [error, data] = await auth_service.registerUser({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        tenant_id: faker.string.uuid(),
        type: faker.helpers.enumValue(UserTypes),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.company');
    });
  });

  describe('AuthService.updateUser', () => {
    it("returns a not found error if user doesn't exist", async () => {
      user_repository_mock.getUserById.mockResolvedValueOnce(null);

      const [error, data] = await auth_service.updateUser({
        user_id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.user');
    });

    it("updates an user", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      });

      user_repository_mock.getUserById.mockResolvedValueOnce(user);
      encryptor_mock.createHash.mockReturnValueOnce('test');

      const [error] = await auth_service.updateUser({
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
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      });

      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      const email = faker.internet.email();
      const [error] = await auth_service.updateUser({
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
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      });

      user_repository_mock.getUserById.mockResolvedValueOnce(user);
      encryptor_mock.createHash.mockReturnValueOnce('test');

      const [error] = await auth_service.updateUser({
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

      const [error, data] = await auth_service.updatePolicies({
        user_id: faker.string.uuid(),
        policy_slugs: [],
        mode: 'attach',
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.user');
    });

    it("should attach policies", async () => {
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      });

      const attach_policy_spy = jest.spyOn(user, 'attachPolicy');

      policy_repository_mock.getPolicies.mockResolvedValueOnce(
        new Collection([
          new Policy({
            id: faker.string.uuid(),
            slug: faker.word.verb(),
          }),
          new Policy({
            id: faker.string.uuid(),
            slug: faker.word.verb(),
          }),
        ])
      );
      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      const [error] = await auth_service.updatePolicies({
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
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      });

      const dettach_policy_spy = jest.spyOn(user, 'dettachPolicy');

      policy_repository_mock.getPolicies.mockResolvedValueOnce(
        new Collection([
          new Policy({
            id: faker.string.uuid(),
            slug: faker.word.verb(),
          }),
          new Policy({
            id: faker.string.uuid(),
            slug: faker.word.verb(),
          }),
        ])
      );
      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      const [error] = await auth_service.updatePolicies({
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
      user_repository_mock.getUsers.mockResolvedValueOnce(
        new Page([
          new User({
            id: faker.string.uuid(),
            email: faker.internet.email(),
            password: faker.string.alphanumeric(),
            policies: [],
            type: faker.helpers.enumValue(UserTypes),
          }),
          new User({
            id: faker.string.uuid(),
            email: faker.internet.email(),
            password: faker.string.alphanumeric(),
            policies: [],
            type: faker.helpers.enumValue(UserTypes),
          })
        ],
          {
            next_page: 2,
            total_of_pages: 2,
          }
        ));

      const [error, data] = await auth_service.getUsers({});

      expect(error).toBeUndefined();
      expect(data!.result[0]).not.toBeInstanceOf(User);
      expect(data!.result).toHaveLength(2);
      expect(data!.page_result).toEqual({
        next_page: 2,
        total_of_pages: 2
      });
    });
  });

  describe('AuthService.changeAccessPlan', () => {
    it("returns a not found error if access plan doesn't exist", async () => {
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(null);

      const [error, data] = await auth_service.changeAccessPlan({
        user_id: faker.string.uuid(),
        access_plan_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.access_plan');
    });

    it("returns a not found error if user doesn't exist", async () => {
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(new AccessPlan({
        id: faker.string.uuid(),
        active: faker.datatype.boolean(),
        amount: faker.number.float(),
        type: AccessPlanTypes.ANNUALLY,
      }));

      user_repository_mock.getUserById.mockResolvedValueOnce(null);

      const [error, data] = await auth_service.changeAccessPlan({
        user_id: faker.string.uuid(),
        access_plan_id: faker.string.uuid(),
      });

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.user');
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
        type: faker.helpers.enumValue(UserTypes),
      });

      const change_access_plan_spy = jest.spyOn(user, 'changeAccessPlan');

      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      const [error] = await auth_service.changeAccessPlan({
        user_id: faker.string.uuid(),
        access_plan_id: faker.string.uuid(),
      });

      expect(error).toBeUndefined();
      expect(change_access_plan_spy).toHaveBeenCalledWith(access_plan);
      expect(user_repository_mock.updateUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('AuthService.createAccessPlan', () => {
    it('should create a new access plan', async () => {
      const params = {
        amount: faker.number.float(),
        type: faker.helpers.enumValue(AccessPlanTypes),
        description: faker.lorem.lines(),
      };

      const [error, data] = await auth_service.createAccessPlan(params);

      expect(error).toBeUndefined();
      expect(data!.id).toBeDefined();
      expect(data!.active).toBe(false);
      expect(data!.amount).toBe(params.amount);
      expect(data!.description).toBe(params.description);
      expect(data!.type).toBe(params.type);
      expect(access_plan_repository_mock.createAccessPlan).toHaveBeenCalled();
    });

    it('should return a domain error when amount is negative', async () => {
      const params = {
        amount: faker.number.float() * -1,
        type: faker.helpers.enumValue(AccessPlanTypes),
        description: faker.lorem.lines(),
      };

      const [error, data] = await auth_service.createAccessPlan(params);

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe('AuthService.updateAccessPlan', () => {
    it("should return a not found error if access plan doesn't", async () => {
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(null);

      const params = {
        access_plan_id: faker.string.uuid(),
        amount: faker.number.float(),
        type: faker.helpers.enumValue(AccessPlanTypes),
        description: faker.lorem.lines(),
        active: faker.datatype.boolean(),
      };

      const [error] = await auth_service.updateAccessPlan(params);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error!.message).toEqual('notfound.access_plan');
    });

    it('should update a access plan', async () => {
      const access_plan_id = faker.string.uuid();
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(
        new AccessPlan({
          id: access_plan_id,
          active: faker.datatype.boolean(),
          amount: faker.number.float(),
          type: faker.helpers.enumValue(AccessPlanTypes),
          description: faker.lorem.lines(),
        })
      );

      const params = {
        access_plan_id,
        amount: faker.number.float(),
        type: faker.helpers.enumValue(AccessPlanTypes),
        description: faker.lorem.lines(),
        active: faker.datatype.boolean(),
      };

      const [error] = await auth_service.updateAccessPlan(params);

      expect(error).toBeUndefined();
      expect(access_plan_repository_mock.updateAccessPlan).toHaveBeenCalled();
      const obj = access_plan_repository_mock.updateAccessPlan.mock.calls[0][0].toObject();
      expect(obj.id).toEqual(params.access_plan_id);
      expect(obj.amount).toEqual(params.amount);
      expect(obj.description).toEqual(params.description);
      expect(obj.type).toEqual(params.type);
      expect(obj.active).toEqual(params.active);
    });

    it('should return a domain error if amount is negative', async () => {
      access_plan_repository_mock.getAccessPlanById.mockResolvedValueOnce(
        new AccessPlan({
          active: faker.datatype.boolean(),
          amount: faker.number.float(),
          type: faker.helpers.enumValue(AccessPlanTypes),
          description: faker.lorem.lines(),
        })
      );
      const params = {
        access_plan_id: faker.string.uuid(),
        amount: faker.number.float() * -1,
        type: faker.helpers.enumValue(AccessPlanTypes),
        description: faker.lorem.lines(),
        active: faker.datatype.boolean(),
      };

      const [error] = await auth_service.updateAccessPlan(params);

      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe('AuthService.getAccessPlans', () => {
    it("should return an array of access plan", async () => {
      access_plan_repository_mock.getAccessPlans.mockResolvedValueOnce(
        new Collection([
          new AccessPlan({
            active: faker.datatype.boolean(),
            amount: faker.number.float(),
            type: faker.helpers.enumValue(AccessPlanTypes),
            description: faker.lorem.lines(),
          }),
          new AccessPlan({
            active: faker.datatype.boolean(),
            amount: faker.number.float(),
            type: faker.helpers.enumValue(AccessPlanTypes),
            description: faker.lorem.lines(),
          })
        ])
      );

      const [error, data] = await auth_service.getAccessPlans();

      expect(data).toHaveLength(2);
      expect(error).toBeUndefined();
    });
  });

  describe('AuthService.getPolicies', () => {
    it("should return an array of policy", async () => {
      policy_repository_mock.getPolicies.mockResolvedValueOnce(
        new Collection(
          [
            new Policy({
              slug: faker.helpers.slugify(`${faker.word.words()} ${faker.word.words()}`),
              description: faker.lorem.lines(),
              is_secret: faker.datatype.boolean()
            }),
            new Policy({
              slug: faker.helpers.slugify(`${faker.word.words()} ${faker.word.words()}`),
              description: faker.lorem.lines(),
              is_secret: faker.datatype.boolean()
            }),
          ]
        )
      );

      const [error, data] = await auth_service.getPolicies();

      expect(data).toHaveLength(2);
      expect(error).toBeUndefined();
    });
  });

  describe('AuthService.forgotPassword', () => {
    it("should return not found error if user doesn't exist", async () => {
      user_repository_mock.getUserByEmail.mockResolvedValueOnce(null);

      const [error] = await auth_service.forgotPassword({ email: faker.internet.email() });

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("should create a new verification code", async () => {
      user_repository_mock.getUserByEmail.mockResolvedValueOnce(
        new User({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          policies: [],
          type: faker.helpers.enumValue(UserTypes),
        })
      );

      const [error] = await auth_service.forgotPassword({ email: faker.internet.email() });

      expect(error).toBeUndefined();
      expect(verification_code_mock.createVerificationCode).toHaveBeenCalled();
    });

    it("should send an email with the generated verification code", async () => {
      user_repository_mock.getUserByEmail.mockResolvedValueOnce(
        new User({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          policies: [],
          type: faker.helpers.enumValue(UserTypes),
        })
      );

      const [error] = await auth_service.forgotPassword({ email: faker.internet.email() });

      expect(error).toBeUndefined();
      expect(email_service_mock.send).toHaveBeenCalled();
    });
  });

  describe('AuthService.resetPassword', () => {
    it("should return not found error if verification code doesn't exsit", async () => {
      verification_code_mock.getVerificationCodeByCode.mockResolvedValueOnce(null);

      const [error] = await auth_service.resetPassword({
        code: faker.string.numeric(4),
        password: faker.string.alphanumeric()
      });

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should return expired code error if verification code has expired', async () => {
      verification_code_mock.getVerificationCodeByCode.mockResolvedValueOnce(
        new VerificationCode({
          code: faker.string.numeric(4),
          expired_at: faker.date.past(),
          user_id: faker.string.uuid(),
        })
      );

      const [error] = await auth_service.resetPassword({
        code: faker.string.numeric(4),
        password: faker.string.alphanumeric()
      });

      expect(error).toBeInstanceOf(ExpiredCodeError);
    });

    it('should update user password', async () => {
      const verification_code = new VerificationCode({
        code: faker.string.numeric(4),
        expired_at: faker.date.future(),
        user_id: faker.string.uuid(),
      });

      verification_code_mock.getVerificationCodeByCode.mockResolvedValueOnce(verification_code);

      const user = new User({
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      });

      user_repository_mock.getUserById.mockResolvedValueOnce(user);

      encryptor_mock.createHash.mockReturnValueOnce('test');

      const [error] = await auth_service.resetPassword({
        code: faker.string.numeric(4),
        password: faker.string.alphanumeric()
      });

      expect(error).toBeUndefined();
      expect(user_repository_mock.getUserById).toHaveBeenCalledWith(verification_code.user_id);
      expect(user_repository_mock.updateUser).toHaveBeenCalled();
      const new_password = user_repository_mock.updateUser.mock.calls[0][0].toObject().password;
      expect(new_password).toEqual('test');
    });
  });
});
