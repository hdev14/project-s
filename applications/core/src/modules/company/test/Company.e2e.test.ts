import AuthTokenManager from '@auth/app/AuthTokenManager';
import { AccessPlanTypes } from '@auth/domain/AccessPlan';
import { PolicyProps } from '@auth/domain/Policy';
import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import { TaxTypes } from '@company/domain/Commission';
import CompanyModule from '@company/infra/CompanyModule';
import { faker } from '@faker-js/faker';
import FileStorage from '@global/app/FileStorage';
import GlobalModule from '@global/infra/GlobalModule';
import { Policies } from '@shared/Principal';
import cleanUpDatabase from '@shared/test_utils/cleanUpDatabase';
import AccessPlanFactory from '@shared/test_utils/factories/AccessPlanFactory';
import CatalogItemFactory from '@shared/test_utils/factories/CatalogItemFactory';
import CommissionFactory from '@shared/test_utils/factories/CommissionFactory';
import PolicyFactory from '@shared/test_utils/factories/PolicyFactory';
import ServiceLogFactory from '@shared/test_utils/factories/ServiceLogFactory';
import UserFactory from '@shared/test_utils/factories/UserFactory';
import '@shared/test_utils/matchers/toBeNullInDatabase';
import '@shared/test_utils/matchers/toEqualInDatabase';
import types from '@shared/types';
import UserTypes from '@shared/UserTypes';
import { resolve } from 'path';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Company E2E tests', () => {
  const application = new Application({
    modules: [
      new GlobalModule(),
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
  const policy_facotry = new PolicyFactory();
  const access_plan_factory = new AccessPlanFactory();

  afterEach(cleanUpDatabase);

  describe('POST: /api/companies', () => {
    it("returns status code 409 if company's document already exists", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        document: faker.string.numeric(14),
        type: UserTypes.COMPANY,
      });

      const response = await request
        .post('/api/companies')
        .set('Content-Type', 'application/json')
        .send({
          name: faker.company.name(),
          email: faker.internet.email(),
          document: company.document,
          bank: {
            account: faker.string.numeric(5),
            account_digit: faker.string.numeric(1),
            agency: faker.string.numeric(5),
            agency_digit: faker.string.numeric(1),
            bank_code: faker.string.numeric(3),
          },
          address: {
            street: faker.location.street(),
            district: faker.location.streetAddress(),
            state: faker.location.state({ abbreviated: true }),
            number: faker.location.buildingNumber(),
            complement: faker.string.sample(),
          },
          access_plan_id: faker.string.uuid(),
        });

      expect(response.status).toEqual(409);
      expect(response.body.message).toEqual('CNPJ já cadastrado');
    });

    it("returns status code 400 if data is invalid", async () => {
      const response = await request
        .post('/api/companies')
        .set('Content-Type', 'application/json')
        .send({
          name: faker.number.int(),
          email: faker.string.sample(),
          document: faker.string.numeric(10),
          bank: {
            account: faker.number.float(),
            account_digit: faker.number.float(),
            agency: faker.number.float(),
            agency_digit: faker.number.float(),
            bank_code: faker.number.float(),
          },
          address: {
            street: faker.number.float(),
            district: faker.number.float(),
            state: faker.number.float(),
            number: faker.number.float(),
            complement: faker.number.float(),
          },
          access_plan_id: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(15);
    });

    it('creates a new company', async () => {
      const policies: PolicyProps[] = [];
      const slugs = Object.values(Policies);

      for (let idx = 0; idx < slugs.length; idx++) {
        policies.push({
          id: faker.string.uuid(),
          slug: slugs[idx],
        });
      }

      await policy_facotry.createMany(policies);
      const access_plan = await access_plan_factory.createOne({
        id: faker.string.uuid(),
        active: true,
        amount: faker.number.float(),
        type: faker.helpers.enumValue(AccessPlanTypes),
      });

      const data = {
        name: faker.company.name(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(5),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        },
        address: {
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
        },
        access_plan_id: access_plan.id
      };

      const response = await request
        .post('/api/companies')
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      await expect({
        name: data.name,
        email: data.email,
        document: data.document,
        account: data.bank.account,
        account_digit: data.bank.account_digit,
        agency: data.bank.agency,
        agency_digit: data.bank.agency_digit,
        bank_code: data.bank.bank_code,
        street: data.address.street,
        district: data.address.district,
        state: data.address.state,
        number: data.address.number,
        complement: data.address.complement,
        access_plan_id: data.access_plan_id,
      }).toEqualInDatabase('users', response.body.id);
    });

    it("returns status code 404 if access plan doesn't exist", async () => {
      const policies: PolicyProps[] = [];
      const slugs = Object.values(Policies);

      for (let idx = 0; idx < slugs.length; idx++) {
        policies.push({
          id: faker.string.uuid(),
          slug: slugs[idx],
        });
      }

      await policy_facotry.createMany(policies);

      const data = {
        name: faker.company.name(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        bank: {
          account: faker.string.numeric(5),
          account_digit: faker.string.numeric(1),
          agency: faker.string.numeric(5),
          agency_digit: faker.string.numeric(1),
          bank_code: faker.string.numeric(3),
        },
        address: {
          street: faker.location.street(),
          district: faker.location.streetAddress(),
          state: faker.location.state({ abbreviated: true }),
          number: faker.location.buildingNumber(),
          complement: faker.string.sample(),
        },
        access_plan_id: faker.string.uuid(),
      };

      const response = await request
        .post('/api/companies')
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Plano de acesso não encontrado');
    });
  });

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
          type: UserTypes.COMPANY,
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: UserTypes.COMPANY,
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: UserTypes.COMPANY,
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: UserTypes.COMPANY,
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          tenant_id: company_id,
          type: UserTypes.EMPLOYEE,
        },
      ]);

      const response = await request
        .get('/api/companies/')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toHaveLength(4);
      expect(response.body).not.toHaveProperty('page_result');
    });

    it('should return companies with pagination', async () => {
      await user_factory.createMany([
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: UserTypes.COMPANY,
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: UserTypes.COMPANY,
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: UserTypes.COMPANY,
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(10),
          type: UserTypes.COMPANY,
        },
      ]);

      let response = await request
        .get('/api/companies/')
        .query({ page: 1, limit: 1 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(4);

      response = await request
        .get('/api/companies/')
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get('/api/companies/')
        .query({ page: 2, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toHaveLength(2);
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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

    const company_id = faker.string.uuid();

    beforeAll(async () => {
      const storage = application.container.get<FileStorage>(types.FileStorage);
      await storage.createBucket(`tenant-${company_id}`);
    });

    it("returns status code 404 if company doesn't exist", async () => {
      const response = await request
        .patch(`/api/companies/${faker.string.uuid()}/brands`)
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('color', faker.color.rgb())
        .attach('logo_file', resolve(__dirname, './fixtures/test.png'), 'test.png');

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 400 if color is invalid", async () => {
      const company = await user_factory.createOne({
        id: company_id,
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY,
      });

      const response = await request
        .patch(`/api/companies/${company.id}/brands`)
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('color', faker.string.sample())
        .attach('logo_file', resolve(__dirname, './fixtures/test.png'), 'test.png');


      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(1);
    });

    it("returns status code 400 if logo_file is empty", async () => {
      const company = await user_factory.createOne({
        id: company_id,
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY,
      });

      const response = await request
        .patch(`/api/companies/${company.id}/brands`)
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('color', faker.color.rgb());


      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('A imagem do logo é obrigatória');
    });

    it("updates company's brand", async () => {
      const company = await user_factory.createOne({
        id: company_id,
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY,
      });

      const color = faker.color.rgb();

      const response = await request
        .patch(`/api/companies/${company.id}/brands`)
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('color', color)
        .attach('logo_file', resolve(__dirname, './fixtures/test.png'), 'test.png');

      expect(response.status).toEqual(204);
      await expect({ color }).toEqualInDatabase('users', company.id!);
      await expect('logo_url').not.toBeNullInDatabase('users', company.id!);
    });
  });

  describe('POST: /api/companies/:company_id/employees', () => {
    it("should return status code 404 if tenant doesn't exist", async () => {
      const response = await request
        .post(`/api/companies/${faker.string.uuid()}/employees`)
        .set('Content-Type', 'application/json')
        .send({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          document: faker.string.numeric(11),
          policies: []
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("should return status code 400 data is invalid", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY,
      });

      const response = await request
        .post(`/api/companies/${company.id}/employees`)
        .set('Content-Type', 'application/json')
        .send({
          name: faker.number.float(),
          email: faker.string.sample(),
          document: faker.string.numeric(5),
          policies: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(4);
    });

    it("creates a new employee", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY,
      });

      await policy_facotry.createOne({
        id: faker.string.uuid(),
        slug: Policies.LIST_USERS,
        description: Policies.LIST_USERS,
      });

      const data = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        policies: [Policies.LIST_USERS]
      };

      const response = await request
        .post(`/api/companies/${company.id}/employees`)
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('document');
      await expect({
        name: data.name,
        email: data.email,
        document: data.document,
        tenant_id: company.id,
      }).toEqualInDatabase('users', response.body.id);
    });
  });

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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
        type: UserTypes.EMPLOYEE,
      });

      const response = await request
        .delete(`/api/companies/${company.id}/employees/${employee.id}`)
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(204);
      await expect('deactivated_at').not.toBeNullInDatabase('users', employee.id!);
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
        type: UserTypes.COMPANY,
      });

      const customer = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.CUSTOMER,
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
        type: UserTypes.COMPANY,
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
        type: UserTypes.EMPLOYEE,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
        type: UserTypes.EMPLOYEE,
      });

      const customer = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.CUSTOMER,
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
        type: UserTypes.COMPANY,
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
        type: UserTypes.EMPLOYEE,
      });

      const customer = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.CUSTOMER,
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
      expect(response.body.result).toHaveLength(3);
      expect(response.body).not.toHaveProperty('page_result');
    });

    it('should return service logs with pagination', async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY,
      });

      const employee = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        tenant_id: company.id,
        type: UserTypes.EMPLOYEE,
      });

      const customer = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.CUSTOMER,
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
      expect(response.body.result).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(3);

      response = await request
        .get(`/api/companies/${company.id}/service-logs`)
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get(`/api/companies/${company.id}/service-logs`)
        .query({ page: 2, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toHaveLength(1);
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
        type: UserTypes.COMPANY,
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
