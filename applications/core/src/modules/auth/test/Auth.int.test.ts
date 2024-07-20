import AuthTokenManager from '@auth/app/AuthTokenManager';
import Encryptor from '@auth/app/Encryptor';
import { AccessPlanTypes } from '@auth/domain/AccessPlan';
import AuthModule from '@auth/infra/AuthModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Policies } from '@shared/infra/Principal';
import SharedModule from '@shared/infra/SharedModule';
import types from '@shared/infra/types';
import Application from 'src/Application';
import supertest from 'supertest';

async function deleteAuthData() {
  await globalThis.db.query('DELETE FROM user_policies');
  await globalThis.db.query('DELETE FROM policies');
  await globalThis.db.query('DELETE FROM verification_codes');
  await globalThis.db.query('DELETE FROM users');
  await globalThis.db.query('DELETE FROM access_plans');
}

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
  const active_access_plan_id = faker.string.uuid();
  const not_active_access_plan_id = faker.string.uuid();
  const policy_slug = faker.word.verb();
  const user = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    password: faker.string.alphanumeric(10),
    policies: Object.values(Policies),
  };
  const tenant_id = faker.string.uuid();
  const { token } = auth_token_manager.generateToken(user);

  beforeEach(async () => {
    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [user.id, user.email, encryptor.createHash(user.password)]
    );
    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [tenant_id, faker.internet.email(), faker.string.alphanumeric(10)]
    );
    await globalThis.db.query(
      'INSERT INTO users (id, email, password, tenant_id) VALUES ($1, $2, $3, $4)',
      [faker.string.uuid(), faker.internet.email(), faker.string.alphanumeric(10), tenant_id]
    );
    await globalThis.db.query(
      'INSERT INTO users (id, email, password, tenant_id) VALUES ($1, $2, $3, $4)',
      [faker.string.uuid(), faker.internet.email(), faker.string.alphanumeric(10), tenant_id]
    );
    await globalThis.db.query(
      'INSERT INTO access_plans(id, active, amount, type, description) VALUES($1, $2, $3, $4, $5)',
      [active_access_plan_id, true, faker.number.float(), AccessPlanTypes.ANNUALLY, faker.lorem.lines(1)]
    );
    await globalThis.db.query(
      'INSERT INTO access_plans(id, active, amount, type, description) VALUES($1, $2, $3, $4, $5)',
      [not_active_access_plan_id, false, faker.number.float(), AccessPlanTypes.ANNUALLY, faker.lorem.lines(1)]
    );
    await globalThis.db.query(
      'INSERT INTO policies(id, slug, description) VALUES($1, $2, $3)',
      [faker.string.uuid(), policy_slug, faker.lorem.lines(1)]
    );
    await globalThis.db.query(
      'INSERT INTO policies(id, slug, description) VALUES($1, $2, $3)',
      [faker.string.uuid(), faker.helpers.slugify(faker.word.words(2)), faker.lorem.lines(1)]
    );
  });

  afterEach(async () => {
    await deleteAuthData();
  });

  describe('POST: /api/auth/users', () => {
    it('creates a new user', async () => {
      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('password');
      expect(response.body).not.toHaveProperty('access_plan_id');
    });

    it("creates a new tenant's user", async () => {
      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id: user.id,
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('password');
      expect(response.body).not.toHaveProperty('access_plan_id');
      expect(response.body.tenant_id).toEqual(user.id);
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
          access_plan_id: faker.string.uuid() // wrong,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Plano de acesso não encontrado');
    });

    it("creates an user with access plan", async () => {
      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          access_plan_id: active_access_plan_id,
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('password');
      expect(response.body).toHaveProperty('access_plan_id');
    });

    it("returns status code 422 if access plan is not active", async () => {
      const response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          access_plan_id: not_active_access_plan_id,
        });

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Plano de acesso desativado');
    });

    it("returns status code 400 if data is not valid", async () => {
      let response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.string.sample(), // invalid email
          password: faker.string.alphanumeric(10),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toEqual('email');
      expect(response.body.errors[0].message).toEqual('O campo precisa ser um endereço de e-mail válido');

      response = await request
        .post('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(7), // invalid password
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toEqual('password');
      expect(response.body.errors[0].message).toEqual('O campo precisa ter no minimo 8 caracteres');
    });
  });

  describe('PUT: /api/auth/users/:id', () => {
    it('updates an user', async () => {
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

      const result = await globalThis.db.query('SELECT * FROM users WHERE id = $1', [user.id]);

      expect(result.rows[0].email).toEqual(data.email);
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
      const response = await request
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: user.email,
          password: user.password,
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
          password: user.password,
        });


      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Credenciais Inválidas');
    });

    it("returns status code 400 if user's password is wrong", async () => {
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
    it('should return all users', async () => {
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
    it("should update user's policies", async () => {
      let response = await request
        .patch(`/api/auth/users/${user.id}/policies`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          policy_slugs: [policy_slug],
          mode: 'attach'
        });

      expect(response.status).toEqual(204);
      let result = await globalThis.db.query('SELECT count(*) as total FROM user_policies up JOIN policies p ON up.policy_id = p.id WHERE up.user_id = $1', [user.id]);
      expect(result.rows[0].total).toEqual('1');

      response = await request
        .patch(`/api/auth/users/${user.id}/policies`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          policy_slugs: [policy_slug],
          mode: 'dettach'
        });

      expect(response.status).toEqual(204);
      result = await globalThis.db.query('SELECT count(*) as total FROM user_policies JOIN policies ON policy_id = policy_id WHERE user_id = $1', [user.id]);
      expect(result.rows[0].total).toEqual('0');
    });

    it("returns status code 404 if user doesn't exist", async () => {
      const response = await request
        .patch(`/api/auth/users/${faker.string.uuid()}/policies`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          policy_slugs: [policy_slug],
          mode: 'attach'
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Usuário não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const response = await request
        .patch(`/api/auth/users/${user.id}/policies`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          policy_slugs: [],
          mode: faker.word.verb(),
        });

      response.headers

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(2);
      expect(response.body.errors[0].field).toEqual('policy_slugs');
      expect(response.body.errors[0].message).toEqual('O campo precisa ser um array válido');
      expect(response.body.errors[1].field).toEqual('mode');
      expect(response.body.errors[1].message).toEqual('O campo precisa ser um dos valores: attach ou dettach');
    });
  });

  describe('POST: /api/auth/access_plans', () => {
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
    it('should update access plan', async () => {
      const data = {
        amount: faker.number.float({ fractionDigits: 5 }),
        type: faker.helpers.enumValue(AccessPlanTypes),
        description: faker.lorem.lines(),
        active: faker.datatype.boolean(),
      };

      const response = await request
        .put(`/api/auth/access_plans/${active_access_plan_id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);
      const result = await globalThis.db.query('SELECT * FROM access_plans WHERE id = $1', [active_access_plan_id]);
      expect(result.rows[0].amount).toEqual(data.amount);
      expect(result.rows[0].type).toEqual(data.type);
      expect(result.rows[0].description).toEqual(data.description);
      expect(result.rows[0].active).toEqual(data.active);
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
      const response = await request
        .put(`/api/auth/access_plans/${active_access_plan_id}`)
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
      const response = await request
        .post('/api/auth/passwords')
        .set('Content-Type', 'application/json')
        .send({ email: user.email });

      expect(response.status).toEqual(204);
      const result = await globalThis.db.query('SELECT * FROM verification_codes WHERE user_id = $1', [user.id]);
      expect(result.rows[0]).toBeDefined();
    });
  });
});