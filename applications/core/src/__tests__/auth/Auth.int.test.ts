import { AccessPlanTypes } from '@auth/domain/AccessPlan';
import AuthModule from '@auth/infra/AuthModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import Application from 'src/Application';
import supertest from 'supertest';

async function deleteAuthData() {
  await globalThis.db.query('DELETE FROM user_policies');
  await globalThis.db.query('DELETE FROM policies');
  await globalThis.db.query('DELETE FROM users');
  await globalThis.db.query('DELETE FROM access_plans');
}

describe('Auth integration tests', () => {
  const request = supertest(new Application({ modules: [new AuthModule()] }).server);
  const active_access_plan_id = faker.string.uuid();
  const not_active_access_plan_id = faker.string.uuid();
  const user_id = faker.string.uuid();

  beforeEach(async () => {
    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [user_id, faker.internet.email(), faker.string.alphanumeric(10)]
    );
    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [faker.string.uuid(), faker.internet.email(), faker.string.alphanumeric(10)]
    );
    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [faker.string.uuid(), faker.internet.email(), faker.string.alphanumeric(10)]
    );
    await globalThis.db.query(
      'INSERT INTO access_plans(id, active, amount, type, description) VALUES($1, $2, $3, $4, $5)',
      [active_access_plan_id, true, faker.number.float(), AccessPlanTypes.ANNUALLY, faker.lorem.lines(1)]
    );
    await globalThis.db.query(
      'INSERT INTO access_plans(id, active, amount, type, description) VALUES($1, $2, $3, $4, $5)',
      [not_active_access_plan_id, false, faker.number.float(), AccessPlanTypes.ANNUALLY, faker.lorem.lines(1)]
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
        .put(`/api/auth/users/${user_id}`)
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(204);

      const result = await globalThis.db.query('SELECT * FROM users WHERE id = $1', [user_id]);

      expect(result.rows[0].email).toEqual(data.email);
    });

    it("returns status code 404 if user doesn't exist", async () => {
      const response = await request
        .put(`/api/auth/users/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Usuário não encontrado');
    });

    it("returns status code 400 if data is invalid", async () => {
      let response = await request
        .put(`/api/auth/users/${user_id}`)
        .set('Content-Type', 'application/json')
        .send({
          email: faker.string.sample(), // invalid email
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toEqual('email');
      expect(response.body.errors[0].message).toEqual('O campo precisa ser um endereço de e-mail válido');

      response = await request
        .put(`/api/auth/users/${user_id}`)
        .set('Content-Type', 'application/json')
        .send({
          password: faker.string.alphanumeric(7), // invalid password
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toEqual('password');
      expect(response.body.errors[0].message).toEqual('O campo precisa ter no minimo 8 caracteres');
    });
  });

  it.todo('POST: /api/auth/login');

  describe('GET: /api/auth/users/', () => {
    it("should return all users", async () => {
      const response = await request
        .get('/api/auth/users')
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(3);
      expect(response.body).not.toHaveProperty('pagination');
    });

    it("should return users with pagination", async () => {
      let response = await request
        .get('/api/auth/users')
        .query({ page: 1, limit: 1 })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(3);

      response = await request
        .get('/api/auth/users')
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get('/api/auth/users')
        .query({ page: 2, limit: 2 })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(-1);
      expect(response.body.page_result.total_of_pages).toEqual(2);
    });
  });

  it.todo('PATCH: /api/auth/users/:id/policies');
});