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

  beforeAll(async () => {
    await globalThis.db.query(
      'INSERT INTO access_plans(id, active, amount, type, description) VALUES($1, $2, $3, $4, $5)',
      [active_access_plan_id, true, faker.number.float(), AccessPlanTypes.ANNUALLY, faker.lorem.lines(1)]
    );
    await globalThis.db.query(
      'INSERT INTO access_plans(id, active, amount, type, description) VALUES($1, $2, $3, $4, $5)',
      [not_active_access_plan_id, false, faker.number.float(), AccessPlanTypes.ANNUALLY, faker.lorem.lines(1)]
    );
  });

  afterAll(async () => {
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
  });

  it.todo('PUT: /api/auth/users');

  it.todo('POST: /api/auth/login');

  it.todo('GET: /api/auth/users');

  it.todo('PATCH: /api/auth/users/:id/policies');
});