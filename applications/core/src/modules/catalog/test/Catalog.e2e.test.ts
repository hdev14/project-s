import AuthTokenManager from '@auth/app/AuthTokenManager';
import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import FileStorage from '@global/app/FileStorage';
import GlobalModule from '@global/infra/GlobalModule';
import { Policies } from '@shared/Principal';
import cleanUpDatabase from '@shared/test_utils/cleanUpDatabase';
import CatalogItemFactory from '@shared/test_utils/factories/CatalogItemFactory';
import UserFactory from '@shared/test_utils/factories/UserFactory';
import '@shared/test_utils/matchers/toEqualInDatabase';
import types from '@shared/types';
import UserTypes from '@shared/UserTypes';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Catalog E2E tests', () => {
  const application = new Application({ modules: [new GlobalModule(), new AuthModule(), new CatalogModule()] });
  const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  const request = supertest(application.server);
  const user_factory = new UserFactory();
  const catalog_item_factory = new CatalogItemFactory();
  const tenant_id = faker.string.uuid();

  beforeAll(async () => {
    const storage = application.container.get<FileStorage>(types.FileStorage);
    await storage.createBucket(`tenant-${tenant_id}`);
  });

  afterEach(cleanUpDatabase);

  describe('POST: /api/catalogs/items', () => {
    const tenant_id = faker.string.uuid();
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.CREATE_CATALOG_ITEM],
    });

    beforeAll(async () => {
      const storage = application.container.get<FileStorage>(types.FileStorage);
      await storage.createBucket(`tenant-${tenant_id}`);
    });

    it('creates a new catalog item', async () => {
      const tenant = await user_factory.createOne({
        id: tenant_id,
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      const picture_file = readFileSync(resolve(__dirname, './fixtures/test.png'));

      const response = await request
        .post('/api/catalogs/items')
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('name', faker.commerce.productName())
        .field('description', faker.commerce.productDescription())
        .field('amount', faker.number.float())
        .field('attributes[]', JSON.stringify({ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }))
        .field('is_service', faker.datatype.boolean())
        .field('tenant_id', tenant.id!)
        .attach('picture_file', picture_file, 'test.png');

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
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('name', faker.commerce.productName())
        .field('description', faker.commerce.productDescription())
        .field('amount', faker.number.float())
        .field('attributes[]', JSON.stringify({ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }))
        .field('is_service', faker.datatype.boolean())
        .field('tenant_id', faker.string.uuid());

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 400 if data is not valid", async () => {
      const response = await request
        .post('/api/catalogs/items')
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('name', faker.datatype.boolean())
        .field('description', faker.datatype.boolean())
        .field('amount', faker.string.sample())
        .field('attributes[]', JSON.stringify({ name: faker.number.int(), description: faker.number.int() }))
        .field('is_service', faker.string.sample())
        .field('tenant_id', faker.string.sample());

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(4);
    });

    it("returns status code 400 if amount is negative", async () => {
      const tenant = await user_factory.createOne({
        id: tenant_id,
        email: faker.internet.email(),
        password: faker.string.alphanumeric(10),
        type: UserTypes.COMPANY
      });

      const response = await request
        .post('/api/catalogs/items')
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('name', faker.commerce.productName())
        .field('description', faker.commerce.productDescription())
        .field('amount', faker.number.float() * -1)
        .field('attributes[]', JSON.stringify({ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }))
        .field('is_service', faker.datatype.boolean())
        .field('tenant_id', tenant.id!);

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
      expect(response.body.result).toHaveLength(3);
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
      expect(response.body.result).toHaveLength(2);
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
      expect(response.body.result).toHaveLength(1);
      expect(response.body.page_info.next_page).toEqual(2);
      expect(response.body.page_info.total_of_pages).toEqual(3);

      response = await request
        .get('/api/catalogs/items')
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toHaveLength(2);
      expect(response.body.page_info.next_page).toEqual(2);
      expect(response.body.page_info.total_of_pages).toEqual(2);

      response = await request
        .get('/api/catalogs/items')
        .query({ page: 2, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.result).toHaveLength(1);
      expect(response.body.page_info.next_page).toEqual(-1);
      expect(response.body.page_info.total_of_pages).toEqual(2);
    });
  });

  describe('PUT: /api/catalogs/items/:id', () => {
    const { token } = auth_token_manager.generateToken({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.string.alphanumeric(10),
      policies: [Policies.UPDATE_CATALOG_ITEM],
    });

    it.only('updates a catalog item', async () => {
      const tenant = await user_factory.createOne({
        id: tenant_id,
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
      };

      const picture_file = readFileSync(resolve(__dirname, './fixtures/test.png'));

      const response = await request
        .put(`/api/catalogs/items/${catalog_item.id}`)
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('name', data.name)
        .field('description', data.description)
        .field('attributes[]', JSON.stringify(data.attributes[0]))
        .attach('picture_file', picture_file, 'test.png');

      expect(response.status).toEqual(204);
      await expect(data).toEqualInDatabase('catalog_items', catalog_item.id!);
    });

    it("returns status code 404 if catalog item doesn't exist", async () => {
      const response = await request
        .put(`/api/catalogs/items/${faker.string.uuid()}`)
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('name', faker.commerce.productName())
        .field('description', faker.commerce.productDescription())
        .field('attributes[]', JSON.stringify({ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }))

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Item não encontrado');
    });

    it('returns status code 400 if data is invalid', async () => {
      const tenant = await user_factory.createOne({
        id: tenant_id,
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
        .set('Content-Type', 'multipart/form-data')
        .auth(token, { type: 'bearer' })
        .field('name', faker.datatype.boolean())
        .field('description', faker.datatype.boolean())
        .field('attributes[]', JSON.stringify({ name: faker.datatype.boolean(), description: faker.datatype.boolean() }))

      expect(response.status).toEqual(400);
    });
  });
});
