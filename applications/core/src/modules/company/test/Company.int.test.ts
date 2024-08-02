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
  const company_id = faker.string.uuid();
  const customer_id = faker.string.uuid();
  const employee_id = faker.string.uuid();
  const service_id = faker.string.uuid();

  beforeEach(async () => {
    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [company_id, faker.internet.email(), faker.string.alphanumeric(10)]
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
    await globalThis.db.query(
      'INSERT INTO users (id, email, password, tenant_id) VALUES ($1, $2, $3, $4)',
      [customer_id, faker.internet.email(), faker.string.alphanumeric(10), company_id]
    );
    await globalThis.db.query(
      'INSERT INTO users (id, email, password, tenant_id) VALUES ($1, $2, $3, $4)',
      [employee_id, faker.internet.email(), faker.string.alphanumeric(10), company_id]
    );
    await globalThis.db.query(
      'INSERT INTO catalog_items (id, name, description, attributes, is_service, picture_url, tenant_id, amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        service_id,
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        JSON.stringify([]),
        true,
        faker.internet.url(),
        company_id,
        faker.number.float(),
      ]
    );
    await globalThis.db.query(
      'INSERT INTO service_logs (id, commission_amount, employee_id, service_id, customer_id, tenant_id, paid_amount, registed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        faker.string.uuid(),
        faker.number.float(),
        employee_id,
        service_id,
        customer_id,
        company_id,
        faker.number.float(),
        faker.date.anytime()
      ]
    );
    await globalThis.db.query(
      'INSERT INTO service_logs (id, commission_amount, employee_id, service_id, customer_id, tenant_id, paid_amount, registed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        faker.string.uuid(),
        faker.number.float(),
        employee_id,
        service_id,
        customer_id,
        company_id,
        faker.number.float(),
        faker.date.anytime()
      ]
    );
    await globalThis.db.query(
      'INSERT INTO service_logs (id, commission_amount, employee_id, service_id, customer_id, tenant_id, paid_amount, registed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        faker.string.uuid(),
        faker.number.float(),
        employee_id,
        service_id,
        customer_id,
        company_id,
        faker.number.float(),
        faker.date.anytime()
      ]
    );
  });

  afterEach(async () => {
    await globalThis.db.query('DELETE FROM service_logs');
    await globalThis.db.query('DELETE FROM catalog_items');
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

  describe('GET: /api/companies/:company_id', () => {
    it("returns status code 404 if company doesn't exist", async () => {
      const response = await request
        .get(`/api/companies/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns company", async () => {
      const response = await request
        .get(`/api/companies/${company_id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body).toHaveProperty('document');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('bank');
      expect(response.body).toHaveProperty('brand');
      expect(response.body).toHaveProperty('employees');
      expect(response.body).toHaveProperty('access_plan_id');
    });
  });

  describe('PATCH: /api/companies/:company_id/addresses', () => {
    it("returns status code 404 if company doesn't exist", async () => {
      const response = await request
        .patch(`/api/companies/${faker.string.uuid()}/addresses`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          street: faker.location.street(),
          district: faker.location.secondaryAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.string.numeric(),
          complement: faker.string.sample(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 400 if data is invalid", async () => {
      const response = await request
        .patch(`/api/companies/${company_id}/addresses`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          street: faker.number.float(),
          district: faker.number.float(),
          state: faker.number.float(),
          number: faker.number.float(),
          complement: faker.number.float(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(6);
    });

    it("updates company's address", async () => {
      const data = {
        street: faker.location.street(),
        district: faker.location.secondaryAddress(),
        state: faker.location.state({ abbreviated: true }),
        number: faker.string.numeric(),
        complement: faker.string.sample(),
      };

      const response = await request
        .patch(`/api/companies/${company_id}/addresses`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);

      const result = await globalThis.db.query('SELECT * FROM users WHERE id = $1', [company_id]);
      const company = result.rows[0];

      expect(company.street).toEqual(data.street);
      expect(company.district).toEqual(data.district);
      expect(company.state).toEqual(data.state);
      expect(company.number).toEqual(data.number);
      expect(company.complement).toEqual(data.complement);
    });
  });

  describe('PATCH: /api/companies/:company_id/banks', () => {
    it("returns status code 404 if company doesn't exist", async () => {
      const response = await request
        .patch(`/api/companies/${faker.string.uuid()}/banks`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(2),
          agency: faker.string.numeric(4),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 400 if data is invalid", async () => {
      const response = await request
        .patch(`/api/companies/${company_id}/banks`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          account: faker.string.sample({ min: 11, max: 100 }),
          account_digit: faker.string.sample({ min: 11, max: 100 }),
          agency: faker.string.sample({ min: 11, max: 100 }),
          agency_digit: faker.string.sample({ min: 11, max: 100 }),
          bank_code: faker.string.sample({ min: 11, max: 100 }),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(10);
    });

    it("updates company's bank", async () => {
      const data = {
        account: faker.string.numeric(5),
        account_digit: faker.string.numeric(2),
        agency: faker.string.numeric(4),
        agency_digit: faker.string.numeric(1),
        bank_code: faker.string.numeric(3),
      };

      const response = await request
        .patch(`/api/companies/${company_id}/banks`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);

      const result = await globalThis.db.query('SELECT * FROM users WHERE id = $1', [company_id]);
      const company = result.rows[0];

      expect(company.account).toEqual(data.account);
      expect(company.account_digit).toEqual(data.account_digit);
      expect(company.agency).toEqual(data.agency);
      expect(company.agency_digit).toEqual(data.agency_digit);
      expect(company.bank_code).toEqual(data.bank_code);
    });
  });

  describe('PATCH: /api/companies/:company_id/brands', () => {
    it("returns status code 404 if company doesn't exist", async () => {
      const response = await request
        .patch(`/api/companies/${faker.string.uuid()}/brands`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          color: faker.color.rgb(),
          logo_url: faker.internet.url(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 400 if data is invalid", async () => {
      const response = await request
        .patch(`/api/companies/${company_id}/brands`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          color: faker.string.sample(),
          logo_url: faker.number.float(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(2);
    });

    it("updates company's brand", async () => {
      const data = {
        color: faker.color.rgb(),
        logo_url: faker.internet.url(),
      };

      const response = await request
        .patch(`/api/companies/${company_id}/brands`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);

      const result = await globalThis.db.query('SELECT * FROM users WHERE id = $1', [company_id]);
      const company = result.rows[0];

      expect(company.color).toEqual(data.color);
      expect(company.logo_url).toEqual(data.logo_url);
    });
  });

  it.todo('POST: /api/companies/:company_id/employees');

  it.todo('DELETE: /api/companies/:company_id/employees/:employee_id');

  it.todo('POST: /api/companies/:company_id/service-logs');

  describe('GET: /api/companies/:company_id/service-logs', () => {
    it('should return all service logs', async () => {
      const response = await request
        .get(`/api/companies/${company_id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(3);
      expect(response.body).not.toHaveProperty('page_result');
    });

    it('should return service logs with pagination', async () => {
      let response = await request
        .get(`/api/companies/${company_id}/service-logs`)
        .query({ page: 1, limit: 1 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(3);

      response = await request
        .get(`/api/companies/${company_id}/service-logs`)
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get(`/api/companies/${company_id}/service-logs`)
        .query({ page: 2, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(-1);
      expect(response.body.page_result.total_of_pages).toEqual(2);
    });
  });

  it.todo('POST: /api/companies/:company_id/commissions');

  it.todo('PUT: /api/companies/:company_id/commissions/:commission_id');

  it.todo('GET: /api/companies/:company_id/commissions/:commission_id');
});