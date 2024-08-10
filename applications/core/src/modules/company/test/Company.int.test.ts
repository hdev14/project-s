import AuthTokenManager from '@auth/app/AuthTokenManager';
import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import { TaxTypes } from '@company/domain/Commission';
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
  const commission_id = faker.string.uuid();

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

    await globalThis.db.query(
      'INSERT INTO commissions (id, catalog_item_id, tax, tax_type, tenant_id) VALUES ($1, $2, $3, $4, $5)',
      [
        commission_id,
        service_id,
        faker.number.float(),
        faker.helpers.enumValue(TaxTypes),
        company_id,
      ]
    );
  });

  afterEach(async () => {
    await globalThis.db.query('DELETE FROM commissions');
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

  describe('DELETE: /api/companies/:company_id/employees/:employee_id', () => {
    it("returns status code 404 if employee doesn't exist", async () => {
      const response = await request
        .delete(`/api/companies/${company_id}/employees/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Colaborador não encontrado');
    });

    it("should deactivate the employee", async () => {
      const response = await request
        .delete(`/api/companies/${company_id}/employees/${employee_id}`)
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(204);

      const result = await globalThis.db.query('SELECT * FROM users WHERE id = $1', [employee_id]);

      expect(result.rows[0].deactivated_at).not.toBeNull();
      expect(result.rows[0].deactivated_at).toBeInstanceOf(Date);
    });
  });

  describe('POST: /api/companies/:company_id/service-logs', () => {
    it("returns status code 404 if employee doesn't exist", async () => {
      const response = await request
        .post(`/api/companies/${company_id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          employee_id: faker.string.uuid(),
          customer_id,
          service_id,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Colaborador não encontrado');
    });

    it("returns status code 404 if customer doesn't exist", async () => {
      const response = await request
        .post(`/api/companies/${company_id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          employee_id,
          customer_id: faker.string.uuid(),
          service_id,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Cliente não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const response = await request
        .post(`/api/companies/${company_id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          employee_id: faker.string.sample(),
          customer_id: faker.string.sample(),
          service_id: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(3);
    });


    it("should register a new service log", async () => {
      const response = await request
        .post(`/api/companies/${company_id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          employee_id,
          customer_id,
          service_id,
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('commission_amount');
      expect(response.body).toHaveProperty('paid_amount');
      expect(response.body).toHaveProperty('registed_at');
      expect(response.body.employee_id).toEqual(employee_id);
      expect(response.body.service_id).toEqual(service_id);
      expect(response.body.customer_id).toEqual(customer_id);
      expect(response.body.tenant_id).toEqual(company_id);
    });
  });

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

  describe('POST: /api/companies/:company_id/commissions', () => {
    it("returns status code 404 if service doesn't exist", async () => {
      const response = await request
        .post(`/api/companies/${company_id}/commissions`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          catalog_item_id: faker.string.uuid(),
          tax: faker.number.float(),
          tax_type: faker.helpers.enumValue(TaxTypes),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Item não encontrado');
    });

    it("returns status code 400 if data is invalid", async () => {
      const response = await request
        .post(`/api/companies/${company_id}/commissions`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          catalog_item_id: faker.string.sample(),
          tax: faker.string.sample(),
          tax_type: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(3);
    });

    it("creates a new commission", async () => {
      const data = {
        catalog_item_id: service_id,
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
      };

      const response = await request
        .post(`/api/companies/${company_id}/commissions`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.catalog_item_id).toEqual(service_id);
      expect(response.body.tax).toEqual(data.tax);
      expect(response.body.tax_type).toEqual(data.tax_type);
      expect(response.body.tenant_id).toEqual(company_id);
    });

    it("returns status code 400 if tax type is percentage and are greater than 1", async () => {
      const response = await request
        .post(`/api/companies/${company_id}/commissions`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          catalog_item_id: service_id,
          tax: faker.number.float({ min: 1.1, max: 100 }),
          tax_type: TaxTypes.PERCENTAGE,
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Taxa de commissão inválida');
    });
  });

  describe('PUT: /api/companies/:company_id/commissions/:commission_id', () => {
    it("returns status code 404 if commission doesn't exist", async () => {
      const response = await request
        .put(`/api/companies/${company_id}/commissions/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .send({
          tax: faker.number.float(),
          tax_type: faker.helpers.enumValue(TaxTypes),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Comissão não encontrada')
    });

    it("updates a commission", async () => {
      const data = {
        tax: faker.number.float({ fractionDigits: 2 }),
        tax_type: faker.helpers.enumValue(TaxTypes),
      };

      const response = await request
        .put(`/api/companies/${company_id}/commissions/${commission_id}`)
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(204);

      const result = await globalThis.db.query('SELECT * FROM commissions WHERE id = $1', [commission_id]);

      expect(result.rows[0].tax).toEqual(data.tax);
      expect(result.rows[0].tax_type).toEqual(data.tax_type);
    });

    it('returns status code 400 if data is invalid', async () => {
      const response = await request
        .put(`/api/companies/${company_id}/commissions/${commission_id}`)
        .set('Content-Type', 'application/json')
        .send({
          tax: faker.string.sample(),
          tax_type: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(2);
    });
  });

  describe('GET: /api/companies/:company_id/commissions/:commission_id', () => {
    it("returns status code 404 if commission doesn't exist", async () => {
      const response = await request
        .get(`/api/companies/${company_id}/commissions/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Comissão não encontrada');
    });

    it("returns a commission", async () => {
      const response = await request
        .get(`/api/companies/${company_id}/commissions/${commission_id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(commission_id);
      expect(response.body).toHaveProperty('catalog_item_id');
      expect(response.body).toHaveProperty('tax');
      expect(response.body).toHaveProperty('tax_type');
      expect(response.body).toHaveProperty('tenant_id');
    });
  });
});
