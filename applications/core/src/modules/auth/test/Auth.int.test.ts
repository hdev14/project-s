import AuthTokenManager from '@auth/app/AuthTokenManager';
import Encryptor from '@auth/app/Encryptor';
import { AccessPlanTypes } from '@auth/domain/AccessPlan';
import AuthModule from '@auth/infra/AuthModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Policies } from '@shared/infra/Principal';
import SharedModule from '@shared/infra/SharedModule';
import cleanUpDatabase from '@shared/infra/test_utils/cleanUpDatabase';
import AccessPlanFactory from '@shared/infra/test_utils/factories/AccessPlanFactory';
import PolicyFactory from '@shared/infra/test_utils/factories/PolicyFactory';
import UserFactory from '@shared/infra/test_utils/factories/UserFactory';
import VerificationCodeFactory from '@shared/infra/test_utils/factories/VerificationCodeFactory';
import '@shared/infra/test_utils/matchers/toEqualInDatabase';
import '@shared/infra/test_utils/matchers/toExistsInTable';
import '@shared/infra/test_utils/matchers/toHasPoliciesInDatabase';
import types from '@shared/infra/types';
import UserTypes from '@shared/UserTypes';
import Application from 'src/Application';
import supertest from 'supertest';

function cookieExists(cookies: Array<string>) {
  let exists = false;

  for (let idx = 0; idx < cookies.length; idx++) {
    const [cookie, value] = cookies[idx].split(';')[0].split('=');
    if (cookie === 'AT' && value !== '') {
      exists = true;
      break;
    }
  }
  return exists;
}

describe('Auth integration tests', () => {
  const application = new Application({ modules: [new SharedModule(), new AuthModule()] });
  const encryptor = application.container.get<Encryptor>(types.Encryptor);
  const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  const request = supertest(application.server);
  const user_factory = new UserFactory();
  const access_plan_factory = new AccessPlanFactory();
  const policy_factory = new PolicyFactory();
  const verification_code_factory = new VerificationCodeFactory();

  afterEach(cleanUpDatabase);

  describe('POST: /api/auth/users', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.CREATE_TENANT_USER],
    });

    it('creates a new user', async () => {
      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: faker.helpers.enumValue(UserTypes),
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('password');
      expect(response.body).not.toHaveProperty('access_plan_id');
    });

    it("creates a new tenant's user", async () => {
      const tenant = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes)
      });

      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id: tenant.id,
          type: faker.helpers.enumValue(UserTypes)
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('password');
      expect(response.body).not.toHaveProperty('access_plan_id');
      expect(response.body.tenant_id).toEqual(tenant.id);
    });

    it("returns status code 404 if tenant doesn't exist", async () => {
      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id: faker.string.uuid(),
          type: faker.helpers.enumValue(UserTypes),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 404 if access plan doesn't exist", async () => {
      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          access_plan_id: faker.string.uuid(), // wrong,
          type: faker.helpers.enumValue(UserTypes),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Plano de acesso não encontrado');
    });

    it("creates an user with access plan", async () => {
      const access_plan = await access_plan_factory.createOne({
        id: faker.string.uuid(),
        active: true,
        amount: faker.number.float(),
        type: AccessPlanTypes.ANNUALLY,
        description: faker.lorem.lines(1)
      });

      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          access_plan_id: access_plan.id,
          type: faker.helpers.enumValue(UserTypes),
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('password');
      expect(response.body).toHaveProperty('access_plan_id');
    });

    it("returns status code 422 if access plan is not active", async () => {
      const access_plan = await access_plan_factory.createOne({
        id: faker.string.uuid(),
        active: false,
        amount: faker.number.float(),
        type: AccessPlanTypes.ANNUALLY,
        description: faker.lorem.lines(1)
      });

      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          access_plan_id: access_plan.id,
          type: faker.helpers.enumValue(UserTypes),
        });

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Plano de acesso desativado');
    });

    it("returns status code 400 if data is not valid", async () => {
      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.string.sample(), // invalid email
          password: faker.string.alphanumeric(5),
          type: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(3);
    });
  });

  describe('PUT: /api/auth/users/:id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.UPDATE_USER],
    });

    it('updates an user', async () => {
      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes)
      });

      const data = {
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      };

      const response = await request
        .put(`/api/auth/users/${user.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);
      await expect({ email: data.email }).toEqualInDatabase('users', user.id!);
    });

    it("returns status code 404 if user doesn't exist", async () => {
      const response = await request
        .put(`/api/auth/users/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Usuário não encontrado');
    });

    it("returns status code 400 if data is invalid", async () => {
      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes)
      });

      let response = await request
        .put(`/api/auth/users/${user.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          email: faker.string.sample(), // invalid email
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toEqual('email');
      expect(response.body.errors[0].message).toEqual('O campo precisa ser um endereço de e-mail válido');

      response = await request
        .put(`/api/auth/users/${user.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          password: faker.string.alphanumeric(7), // invalid password
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toEqual('password');
      expect(response.body.errors[0].message).toEqual('O campo precisa ter no minimo 8 caracteres');
    });
  });

  describe('POST: /api/auth/login', () => {
    it('should make a login', async () => {
      const password = faker.string.alphanumeric(10);

      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: encryptor.createHash(password),
        type: faker.helpers.enumValue(UserTypes),
      });

      const response = await request
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: user.email,
          password,
        });

      const cookies = (response.headers['set-cookie'] ?? []) as unknown as Array<string>;

      expect(response.status).toEqual(200);
      expect(cookieExists(cookies)).toBeTruthy();
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('auth');
    });

    it("returns status code 400 if user's doesn't exist", async () => {
      const response = await request
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Credenciais Inválidas');
    });

    it("returns status code 400 if user's password is wrong", async () => {
      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes),
      });

      const response = await request
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: user.email,
          password: faker.string.alphanumeric(10),
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Credenciais Inválidas');
    });

    it("returns status code 400 if data is invalid", async () => {
      const response = await request
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.string.alphanumeric(10), // invalid emial
          password: faker.string.alphanumeric(7), // less then 8 characters
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(2);
      expect(response.body.errors[0].field).toEqual('email');
      expect(response.body.errors[0].message).toEqual('O campo precisa ser um endereço de e-mail válido');
      expect(response.body.errors[1].field).toEqual('password');
      expect(response.body.errors[1].message).toEqual('O campo precisa ter no minimo 8 caracteres');
    });
  });

  describe('GET: /api/auth/users', () => {
    const tenant_id = faker.string.uuid();
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.LIST_USERS],
    });

    it('should return all users', async () => {
      await user_factory.createMany([
        {
          id: tenant_id,
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id,
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id,
          type: faker.helpers.enumValue(UserTypes),
        },
      ]);

      const response = await request
        .get('/api/auth/users')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(4);
      expect(response.body).not.toHaveProperty('page_result');
    });

    it('should return users with pagination', async () => {
      await user_factory.createMany([
        {
          id: tenant_id,
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id,
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id,
          type: faker.helpers.enumValue(UserTypes),
        },
      ]);

      let response = await request
        .get('/api/auth/users')
        .query({ page: 1, limit: 1 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(4);

      response = await request
        .get('/api/auth/users')
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get('/api/auth/users')
        .query({ page: 2, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(-1);
      expect(response.body.page_result.total_of_pages).toEqual(2);
    });

    it('should return users filtered by tenant_id', async () => {
      await user_factory.createMany([
        {
          id: tenant_id,
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id,
          type: faker.helpers.enumValue(UserTypes),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id,
          type: faker.helpers.enumValue(UserTypes),
        },
      ]);

      const response = await request
        .get('/api/auth/users')
        .query({ tenant_id })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
    });
  });

  describe('PATCH: /api/auth/users/:id/policies', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.UPDATE_USER_POLICIES],
    });

    it("should update user's policies", async () => {
      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes),
      });

      const policy = await policy_factory.createOne({
        id: faker.string.uuid(),
        slug: faker.helpers.slugify(faker.word.words(2)),
      });

      let response = await request
        .patch(`/api/auth/users/${user.id}/policies`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          policy_slugs: [policy.slug],
          mode: 'attach'
        });

      expect(response.status).toEqual(204);
      await expect(user.id).toHasPoliciesInDatabase();

      response = await request
        .patch(`/api/auth/users/${user.id}/policies`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          policy_slugs: [policy.slug],
          mode: 'dettach'
        });

      expect(response.status).toEqual(204);
      await expect(user.id).not.toHasPoliciesInDatabase();
    });

    it("returns status code 404 if user doesn't exist", async () => {
      const response = await request
        .patch(`/api/auth/users/${faker.string.uuid()}/policies`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          policy_slugs: [faker.helpers.slugify(faker.word.words(2))],
          mode: 'attach'
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Usuário não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes),
      });

      const response = await request
        .patch(`/api/auth/users/${user.id}/policies`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          policy_slugs: [],
          mode: faker.word.verb(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(2);
      expect(response.body.errors[0].field).toEqual('policy_slugs');
      expect(response.body.errors[0].message).toEqual('O campo precisa ser um array válido');
      expect(response.body.errors[1].field).toEqual('mode');
      expect(response.body.errors[1].message).toEqual('O campo precisa ser um valor válido');
    });
  });

  describe('POST: /api/auth/access_plans', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.CREATE_ACCESS_PLAN],
    });

    it('creates a new access plan', async () => {
      const response = await request
        .post('/api/auth/access_plans')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          amount: faker.number.float(),
          type: faker.helpers.enumValue(AccessPlanTypes),
          description: faker.lorem.lines(),
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('amount');
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('active');
    });

    it("returns status code 422 if access plan has a negative amount", async () => {
      const response = await request
        .post('/api/auth/access_plans')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          amount: faker.number.float() * -1,
          type: faker.helpers.enumValue(AccessPlanTypes),
          description: faker.lorem.lines(),
        });

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Valor negativo de plano de acesso');
    });

    it("returns status code 400 if data is not valid", async () => {
      const response = await request
        .post('/api/auth/access_plans')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          amount: faker.string.sample(),
          type: faker.word.words(),
          description: faker.number.int(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(3);
    });
  });

  describe('PUT: /api/auth/access_plans/:id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.UPDATE_ACCESS_PLAN],
    });

    it('should update access plan', async () => {
      const access_plan = await access_plan_factory.createOne({
        id: faker.string.uuid(),
        active: true,
        amount: faker.number.float(),
        type: AccessPlanTypes.ANNUALLY,
        description: faker.lorem.lines(1)
      });

      const data = {
        amount: faker.number.float({ fractionDigits: 5 }),
        type: faker.helpers.enumValue(AccessPlanTypes),
        description: faker.lorem.lines(),
        active: faker.datatype.boolean(),
      };

      const response = await request
        .put(`/api/auth/access_plans/${access_plan.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('access_plans', access_plan.id!);
    });

    it("returns status code 404 if access plan doesn't exist", async () => {
      const response = await request
        .put(`/api/auth/access_plans/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          amount: faker.number.float(),
          type: faker.helpers.enumValue(AccessPlanTypes),
          description: faker.lorem.lines(),
          active: faker.datatype.boolean(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Plano de acesso não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const access_plan = await access_plan_factory.createOne({
        id: faker.string.uuid(),
        active: true,
        amount: faker.number.float(),
        type: AccessPlanTypes.ANNUALLY,
        description: faker.lorem.lines(1)
      });

      const response = await request
        .put(`/api/auth/access_plans/${access_plan.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          amount: faker.string.sample(),
          type: faker.string.sample(),
          description: faker.number.int(),
          active: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(4);
    });
  });

  describe('GET: /api/auth/access_plans', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.LIST_ACCESS_PLANS],
    });

    beforeAll(async () => {
      await access_plan_factory.createMany([
        {
          id: faker.string.uuid(),
          active: true,
          amount: faker.number.float(),
          type: AccessPlanTypes.ANNUALLY,
          description: faker.lorem.lines(1)
        },
        {
          id: faker.string.uuid(),
          active: true,
          amount: faker.number.float(),
          type: AccessPlanTypes.ANNUALLY,
          description: faker.lorem.lines(1)
        },
      ]);
    });

    it('returns an array of access plans', async () => {
      const response = await request
        .get('/api/auth/access_plans')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(2)
    });
  });

  describe('GET: /api/auth/policies', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.LIST_POLICIES],
    });

    beforeAll(async () => {
      await policy_factory.createMany([
        {
          id: faker.string.uuid(),
          slug: faker.word.adjective(),
        },
        {
          id: faker.string.uuid(),
          slug: faker.word.adjective(),
        },
      ]);
    });

    it('returns an array of policies', async () => {
      const response = await request
        .get('/api/auth/policies')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(2)
    });
  });

  describe('POST: /api/auth/passwords', () => {
    it("returns status code 404 if email doesn't exist", async () => {
      const response = await request
        .post('/api/auth/passwords')
        .set('Content-Type', 'application/json')
        .send({ email: faker.internet.email() });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Usuário não encontrado')
    });

    it('returns status code 400 if email is invalid', async () => {
      const response = await request
        .post('/api/auth/passwords')
        .set('Content-Type', 'application/json')
        .send({ email: faker.string.sample() });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(1);
    });

    it('should create a new verification code', async () => {
      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes),
      });

      const response = await request
        .post('/api/auth/passwords')
        .set('Content-Type', 'application/json')
        .send({ email: user.email });

      expect(response.status).toEqual(204);
      await expect({ user_id: user.id }).toExistsInTable('verification_codes');
    });
  });

  describe('PATCH: /api/auth/passwords', () => {
    it("returns status code 404 if verification code doesn't exist", async () => {
      const response = await request
        .patch('/api/auth/passwords')
        .set('Content-Type', 'application/json')
        .send({
          code: faker.string.numeric(4),
          password: faker.string.alphanumeric(10)
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Código não encontrado');
    });

    it('returns status code 400 if verification code has expired', async () => {
      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes),
      });

      const verification_code = await verification_code_factory.createOne({
        id: faker.string.uuid(),
        code: faker.string.numeric(4),
        user_id: user.id!,
        expired_at: faker.date.past(),
      });

      const response = await request
        .patch('/api/auth/passwords')
        .set('Content-Type', 'application/json')
        .send({
          code: verification_code.code,
          password: faker.string.alphanumeric(10)
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('O código está expirado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const response = await request
        .patch('/api/auth/passwords')
        .set('Content-Type', 'application/json')
        .send({
          code: faker.string.numeric(10), // length
          password: faker.string.numeric(6),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(2);
    });

    it('should has changed the user password', async () => {
      const user = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: faker.helpers.enumValue(UserTypes),
      });

      const verification_code = await verification_code_factory.createOne({
        id: faker.string.uuid(),
        code: faker.string.numeric(4),
        user_id: user.id!,
        expired_at: faker.date.future(),
      });

      const response = await request
        .patch('/api/auth/passwords')
        .set('Content-Type', 'application/json')
        .send({
          code: verification_code.code,
          password: faker.string.alphanumeric(10)
        });

      expect(response.status).toEqual(204);
      await expect({ password: user.password }).not.toEqualInDatabase('users', user.id!);
    });
  });
});
