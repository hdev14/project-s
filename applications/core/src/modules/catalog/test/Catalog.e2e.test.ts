import AuthTokenManager from '@auth/app/AuthTokenManager';
import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Policies } from '@shared/infra/Principal';
import SharedModule from '@shared/infra/SharedModule';
import cleanUpDatabase from '@shared/infra/test_utils/cleanUpDatabase';
import CatalogItemFactory from '@shared/infra/test_utils/factories/CatalogItemFactory';
import UserFactory from '@shared/infra/test_utils/factories/UserFactory';
import '@shared/infra/test_utils/matchers/toEqualInDatabase';
import types from '@shared/infra/types';
import UserTypes from '@shared/UserTypes';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Catalog E2E tests', () => {
  const application = new Application({ modules: [new SharedModule(), new AuthModule(), new CatalogModule()] });
  const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  const request = supertest(application.server);
  const user_factory = new UserFactory();
  const catalog_item_factory = new CatalogItemFactory();

  afterEach(cleanUpDatabase);

  describe('POST: /api/catalogs/items', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.CREATE_CATALOG_ITEM],
    });

    it('creates a new catalog item', async () => {
      const tenant = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      const response = await request
        .post('/api/catalogs/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          amount: faker.number.float(),
          attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id,
        });

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('attributes');
      expect(response.body).toHaveProperty('is_service');
      expect(response.body).toHaveProperty('picture_url');
      expect(response.body).toHaveProperty('tenant_id');
    });

    it("returns status code 404 if tenant doesn't exist", async () => {
      const response = await request
        .post('/api/catalogs/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          amount: faker.number.float(),
          attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: faker.string.uuid(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 400 if data is not valid", async () => {
      const response = await request
        .post('/api/catalogs/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.number.int(),
          description: faker.number.int(),
          amount: faker.string.sample(),
          attributes: [{ name: faker.number.int(), description: faker.number.int() }],
          is_service: faker.string.sample(),
          picture_url: faker.string.sample(),
          tenant_id: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(7);
    });

    it("returns status code 400 if amount is negative", async () => {
      const tenant = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      const response = await request
        .post('/api/catalogs/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          amount: faker.number.float() * -1,
          attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id,
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('Valor do item negativo');
    });
  });

  describe('GET: /api/catalogs/items/:tenant_id?', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.LIST_CATALOG_ITEMS],
    });

    it("should return all catalog items", async () => {
      const tenant = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      await catalog_item_factory.createMany([
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id!,
          amount: faker.number.float(),
        },
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id!,
          amount: faker.number.float(),
        },
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id!,
          amount: faker.number.float(),
        },
      ]);

      const response = await request
        .get('/api/catalogs/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({});

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(3);
    });

    it("should return all tenant's catalog items", async () => {
      const tenant = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      await catalog_item_factory.createMany([
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id!,
          amount: faker.number.float(),
        },
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id!,
          amount: faker.number.float(),
        },
      ]);

      const response = await request
        .get('/api/catalogs/items')
        .set('Content-Type', 'application/json')
        .query({ tenant_id: tenant.id })
        .auth(token, { type: 'bearer' })
        .send({});

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
    });

    it('should return users with pagination', async () => {
      const tenant = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      await catalog_item_factory.createMany([
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id!,
          amount: faker.number.float(),
        },
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id!,
          amount: faker.number.float(),
        },
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: tenant.id!,
          amount: faker.number.float(),
        },
      ]);

      let response = await request
        .get('/api/catalogs/items')
        .query({ page: 1, limit: 1 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(3);

      response = await request
        .get('/api/catalogs/items')
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get('/api/catalogs/items')
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

  describe('PUT: /api/catalogs/items/:id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.UPDATE_CATALOG_ITEM],
    });

    it('updates a catalog item', async () => {
      const tenant = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: faker.datatype.boolean(),
        picture_url: faker.internet.url(),
        tenant_id: tenant.id!,
        amount: faker.number.float(),
      });
      const data = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
        picture_url: faker.internet.url(),
      };

      const response = await request
        .put(`/api/catalogs/items/${catalog_item.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send(data);

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('catalog_items', catalog_item.id!);
    });

    it("returns status code 404 if catalog item doesn't exist", async () => {
      const response = await request
        .put(`/api/catalogs/items/${faker.string.uuid()}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
          picture_url: faker.internet.url(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Item não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const tenant = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        attributes: [],
        is_service: faker.datatype.boolean(),
        picture_url: faker.internet.url(),
        tenant_id: tenant.id!,
        amount: faker.number.float(),
      });

      const response = await request
        .put(`/api/catalogs/items/${catalog_item.id}`)
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.number.int(),
          description: faker.number.int(),
          attributes: [{ name: faker.number.int(), description: faker.number.int() }],
          picture_url: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(4);
    });
  });
});