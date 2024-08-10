import AuthTokenManager from '@auth/app/AuthTokenManager';
import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import { TaxTypes } from '@company/domain/Commission';
import CompanyModule from '@company/infra/CompanyModule';
import { faker } from '@faker-js/faker';
import SharedModule from '@shared/infra/SharedModule';
import cleanUpDatabase from '@shared/infra/test_utils/cleanUpDatabase';
import CatalogItemFactory from '@shared/infra/test_utils/factories/CatalogItemFactory';
import CommissionFactory from '@shared/infra/test_utils/factories/CommissionFactory';
import ServiceLogFactory from '@shared/infra/test_utils/factories/ServiceLogFactory';
import UserFactory from '@shared/infra/test_utils/factories/UserFactory';
import '@shared/infra/test_utils/matchers/toEqualInDatabase';
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
  const user_factory = new UserFactory();
  const catalog_item_factory = new CatalogItemFactory();
  const service_log_factory = new ServiceLogFactory();
  const commission_factory = new CommissionFactory();

  afterEach(cleanUpDatabase);

  it.todo('POST: /api/companies');

  describe('GET: /api/companies', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

    it('should return all companies', async () => {
      const company_id = faker.string.uuid();

      await user_factory.createMany([
        {
          id: company_id,
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id: company_id, // customer or employee
        },
      ]);

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
      await user_factory.createMany([
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
        },
      ]);

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
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .get(`/api/companies/${company.id}`)
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
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .patch(`/api/companies/${company.id}/addresses`)
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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const data = {
        street: faker.location.street(),
        district: faker.location.secondaryAddress(),
        state: faker.location.state({ abbreviated: true }),
        number: faker.string.numeric(),
        complement: faker.string.sample(),
      };

      const response = await request
        .patch(`/api/companies/${company.id}/addresses`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('users', company.id!);
    });
  });

  describe('PATCH: /api/companies/:company_id/banks', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .patch(`/api/companies/${company.id}/banks`)
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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const data = {
        account: faker.string.numeric(5),
        account_digit: faker.string.numeric(2),
        agency: faker.string.numeric(4),
        agency_digit: faker.string.numeric(1),
        bank_code: faker.string.numeric(3),
      };

      const response = await request
        .patch(`/api/companies/${company.id}/banks`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('users', company.id!);
    });
  });

  describe('PATCH: /api/companies/:company_id/brands', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .patch(`/api/companies/${company.id}/brands`)
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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const data = {
        color: faker.color.rgb(),
        logo_url: faker.internet.url(),
      };

      const response = await request
        .patch(`/api/companies/${company.id}/brands`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('users', company.id!);
    });
  });

  it.todo('POST: /api/companies/:company_id/employees');

  describe('DELETE: /api/companies/:company_id/employees/:employee_id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

    it("returns status code 404 if employee doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .delete(`/api/companies/${company.id}/employees/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Colaborador não encontrado');
    });

    it("should deactivate the employee", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const response = await request
        .delete(`/api/companies/${company.id}/employees/${employee.id}`)
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(204);
      const result = await globalThis.db.query('SELECT * FROM users WHERE id = $1', [employee.id]);

      expect(result.rows[0].deactivated_at).not.toBeNull();
      expect(result.rows[0].deactivated_at).toBeInstanceOf(Date);
    });
  });

  describe('POST: /api/companies/:company_id/service-logs', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

    it("returns status code 404 if employee doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const customer = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      const response = await request
        .post(`/api/companies/${company.id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          employee_id: faker.string.uuid(),
          customer_id: customer.id,
          service_id: service.id,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Colaborador não encontrado');
    });

    it("returns status code 404 if customer doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      const response = await request
        .post(`/api/companies/${company.id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          employee_id: employee.id,
          customer_id: faker.string.uuid(),
          service_id: service.id,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Cliente não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .post(`/api/companies/${company.id}/service-logs`)
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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const customer = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      const response = await request
        .post(`/api/companies/${company.id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          employee_id: employee.id,
          customer_id: customer.id,
          service_id: service.id,
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('commission_amount');
      expect(response.body).toHaveProperty('paid_amount');
      expect(response.body).toHaveProperty('registed_at');
      expect(response.body.employee_id).toEqual(employee.id);
      expect(response.body.service_id).toEqual(service.id);
      expect(response.body.customer_id).toEqual(customer.id);
      expect(response.body.tenant_id).toEqual(company.id);
    });
  });

  describe('GET: /api/companies/:company_id/service-logs', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

    it('should return all service logs', async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const customer = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      await service_log_factory.createMany([
        {
          id: faker.string.uuid(),
          commission_amount: faker.number.float(),
          employee_id: employee.id!,
          service_id: service.id!,
          customer_id: customer.id!,
          tenant_id: company.id!,
          paid_amount: faker.number.float(),
          registed_at: faker.date.anytime()
        },
        {
          id: faker.string.uuid(),
          commission_amount: faker.number.float(),
          employee_id: employee.id!,
          service_id: service.id!,
          customer_id: customer.id!,
          tenant_id: company.id!,
          paid_amount: faker.number.float(),
          registed_at: faker.date.anytime()
        },
        {
          id: faker.string.uuid(),
          commission_amount: faker.number.float(),
          employee_id: employee.id!,
          service_id: service.id!,
          customer_id: customer.id!,
          tenant_id: company.id!,
          paid_amount: faker.number.float(),
          registed_at: faker.date.anytime()
        },
      ]);

      const response = await request
        .get(`/api/companies/${company.id}/service-logs`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(3);
      expect(response.body).not.toHaveProperty('page_result');
    });

    it('should return service logs with pagination', async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const customer = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      await service_log_factory.createMany([
        {
          id: faker.string.uuid(),
          commission_amount: faker.number.float(),
          employee_id: employee.id!,
          service_id: service.id!,
          customer_id: customer.id!,
          tenant_id: company.id!,
          paid_amount: faker.number.float(),
          registed_at: faker.date.anytime()
        },
        {
          id: faker.string.uuid(),
          commission_amount: faker.number.float(),
          employee_id: employee.id!,
          service_id: service.id!,
          customer_id: customer.id!,
          tenant_id: company.id!,
          paid_amount: faker.number.float(),
          registed_at: faker.date.anytime()
        },
        {
          id: faker.string.uuid(),
          commission_amount: faker.number.float(),
          employee_id: employee.id!,
          service_id: service.id!,
          customer_id: customer.id!,
          tenant_id: company.id!,
          paid_amount: faker.number.float(),
          registed_at: faker.date.anytime()
        },
      ]);

      let response = await request
        .get(`/api/companies/${company.id}/service-logs`)
        .query({ page: 1, limit: 1 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(3);

      response = await request
        .get(`/api/companies/${company.id}/service-logs`)
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get(`/api/companies/${company.id}/service-logs`)
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
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

    it("returns status code 404 if service doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .post(`/api/companies/${company.id}/commissions`)
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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .post(`/api/companies/${company.id}/commissions`)
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
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      const data = {
        catalog_item_id: service.id,
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
      };

      const response = await request
        .post(`/api/companies/${company.id}/commissions`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.catalog_item_id).toEqual(service.id);
      expect(response.body.tax).toEqual(data.tax);
      expect(response.body.tax_type).toEqual(data.tax_type);
      expect(response.body.tenant_id).toEqual(company.id);
    });

    it("returns status code 400 if tax type is percentage and are greater than 1", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      const response = await request
        .post(`/api/companies/${company.id}/commissions`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          catalog_item_id: service.id,
          tax: faker.number.float({ min: 1.1, max: 100 }),
          tax_type: TaxTypes.PERCENTAGE,
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Taxa de commissão inválida');
    });
  });

  describe('PUT: /api/companies/:company_id/commissions/:commission_id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

    it("returns status code 404 if commission doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .put(`/api/companies/${company.id}/commissions/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          tax: faker.number.float(),
          tax_type: faker.helpers.enumValue(TaxTypes),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Comissão não encontrada')
    });

    it("updates a commission", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      const commission = await commission_factory.createOne({
        id: faker.string.uuid(),
        catalog_item_id: service.id!,
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
        tenant_id: company.id!,
      });

      const data = {
        tax: faker.number.float({ fractionDigits: 2 }),
        tax_type: faker.helpers.enumValue(TaxTypes),
      };

      const response = await request
        .put(`/api/companies/${company.id}/commissions/${commission.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('commissions', commission.id!);
    });

    it('returns status code 400 if data is invalid', async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      const commission = await commission_factory.createOne({
        id: faker.string.uuid(),
        catalog_item_id: service.id!,
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
        tenant_id: company.id!,
      });

      const response = await request
        .put(`/api/companies/${company.id}/commissions/${commission.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          tax: faker.string.sample(),
          tax_type: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(2);
    });
  });

  describe('GET: /api/companies/:company_id/commissions/:commission_id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [],
    });

    it("returns status code 404 if commission doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const response = await request
        .get(`/api/companies/${company.id}/commissions/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Comissão não encontrada');
    });

    it("returns a commission", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
      });

      const service = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: true,
        picture_url: faker.internet.url(),
        tenant_id: company.id!,
        amount: faker.number.float(),
      });

      const commission = await commission_factory.createOne({
        id: faker.string.uuid(),
        catalog_item_id: service.id!,
        tax: faker.number.float(),
        tax_type: faker.helpers.enumValue(TaxTypes),
        tenant_id: company.id!,
      });

      const response = await request
        .get(`/api/companies/${company.id}/commissions/${commission.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(commission.id);
      expect(response.body).toHaveProperty('catalog_item_id');
      expect(response.body).toHaveProperty('tax');
      expect(response.body).toHaveProperty('tax_type');
      expect(response.body).toHaveProperty('tenant_id');
    });
  });
});
