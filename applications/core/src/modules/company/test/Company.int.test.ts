import AuthTokenManager from '@auth/app/AuthTokenManager';
import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import CompanyModule from '@company/infra/CompanyModule';
import { faker } from '@faker-js/faker';
import { Policies } from '@shared/infra/Principal';
import SharedModule from '@shared/infra/SharedModule';
import types from '@shared/infra/types';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Company integration tests', () => {
  const application = new Application({
    modules: [
      new SharedModule(),
      new AuthModule(),
      new CatalogModule(),
      new CompanyModule(),
    ]
  });
  const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  const request = supertest(application.server);
  const user = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    password: faker.string.alphanumeric(10),
    policies: Object.values(Policies),
  };
  const { token } = auth_token_manager.generateToken(user);

  beforeEach(async () => {
    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [faker.string.uuid(), faker.internet.email(), faker.string.alphanumeric(10)]
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
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [faker.string.uuid(), faker.internet.email(), faker.string.alphanumeric(10)]
    );
  });

  afterEach(async () => {
    await globalThis.db.query('DELETE FROM users');
  });

  it.todo('POST: /api/companies');

  describe('GET: /api/companies', () => {
    it('should return all companies', async () => {
      const response = await request
        .get('/api/companies/')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(4);
      expect(response.body).not.toHaveProperty('page_result');
    });

    it('should return companies with pagination', async () => {
      let response = await request
        .get('/api/companies/')
        .query({ page: 1, limit: 1 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(4);

      response = await request
        .get('/api/companies/')
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get('/api/companies/')
        .query({ page: 2, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(-1);
      expect(response.body.page_result.total_of_pages).toEqual(2);
    });
  });

  it.todo('GET: /api/companies/:id');

  it.todo('PATCH: /api/companies/:id/addresses');

  it.todo('PATCH: /api/companies/:id/banks');

  it.todo('PATCH: /api/companies/:id/brands');

  it.todo('POST: /api/companies/employees');

  it.todo('DELETE: /api/companies/employees/:id');

  it.todo('POST: /api/companies/service-logs');

  it.todo('GET: /api/companies/service-logs');

  it.todo('POST: /api/companies/commissions');

  it.todo('PUT: /api/companies/commissions/:id');

  it.todo('GET: /api/companies/commissions/:id');
});