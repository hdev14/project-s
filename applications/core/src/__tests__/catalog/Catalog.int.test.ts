import AuthTokenManager from '@auth/app/AuthTokenManager';
import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import GlobalModule from '@shared/infra/GlobalModule';
import types from '@shared/infra/types';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Catalog integration tests', () => {
  const application = new Application({ modules: [new GlobalModule(), new AuthModule(), new CatalogModule()] });
  const auth_token_manager = application.container.get<AuthTokenManager>(types.AuthTokenManager);
  const request = supertest(application.server);
  const user = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    password: faker.string.alphanumeric(10),
  };
  const tenant_id = faker.string.uuid();
  const { token } = auth_token_manager.generateToken(user);

  beforeEach(async () => {
    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [user.id, user.email, user.password]
    );


    await globalThis.db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [tenant_id, user.email, user.password]
    );

    await globalThis.db.query(
      'INSERT INTO catalog_items (id, name, description, attributes, is_service, picture_url, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        faker.string.uuid(),
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        JSON.stringify([]),
        faker.datatype.boolean(),
        faker.internet.url(),
        user.id,
      ]
    )

    await globalThis.db.query(
      'INSERT INTO catalog_items (id, name, description, attributes, is_service, picture_url, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        faker.string.uuid(),
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        JSON.stringify([]),
        faker.datatype.boolean(),
        faker.internet.url(),
        tenant_id
      ]
    )

    await globalThis.db.query(
      'INSERT INTO catalog_items (id, name, description, attributes, is_service, picture_url, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        faker.string.uuid(),
        faker.commerce.productName(),
        faker.commerce.productDescription(),
        JSON.stringify([]),
        faker.datatype.boolean(),
        faker.internet.url(),
        tenant_id
      ]
    )
  });

  afterEach(async () => {
    await globalThis.db.query('DELETE FROM catalog_items');
    await globalThis.db.query('DELETE FROM users');
  });

  describe('POST: /api/catalog/items', () => {
    it('creates a new catalog item', async () => {
      const response = await request
        .post('/api/catalog/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          attributes: [{ name: faker.commerce.productAdjective(), description: faker.lorem.lines() }],
          is_service: faker.datatype.boolean(),
          picture_url: faker.internet.url(),
          tenant_id: user.id,
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
        .post('/api/catalog/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
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
        .post('/api/catalog/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({
          name: faker.number.int(),
          description: faker.number.int(),
          attributes: [{ name: faker.number.int(), description: faker.number.int() }],
          is_service: faker.string.sample(),
          picture_url: faker.string.sample(),
          tenant_id: faker.string.sample(),
        });

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(6);
    });
  });

  describe('GET: /api/catalog/items/:tenant_id?', () => {
    it("should return all catalog items", async () => {
      const response = await request
        .get('/api/catalog/items')
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send({});

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(3);
    });

    it("should return all tenant's catalog items", async () => {
      const response = await request
        .get('/api/catalog/items')
        .set('Content-Type', 'application/json')
        .query({ tenant_id })
        .auth(token, { type: 'bearer' })
        .send({});

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
    });

    it('should return users with pagination', async () => {
      let response = await request
        .get('/api/catalog/items')
        .query({ page: 1, limit: 1 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(3);

      response = await request
        .get('/api/catalog/items')
        .query({ page: 1, limit: 2 })
        .set('Content-Type', 'application/json')
        .auth(token, { type: 'bearer' })
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get('/api/catalog/items')
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
});