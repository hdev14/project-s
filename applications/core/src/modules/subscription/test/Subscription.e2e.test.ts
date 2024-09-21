import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import { faker } from '@faker-js/faker/locale/pt_BR';
import FileStorage from '@global/app/FileStorage';
import GlobalModule from '@global/infra/GlobalModule';
import cleanUpDatabase from '@shared/test_utils/cleanUpDatabase';
import CatalogItemFactory from '@shared/test_utils/factories/CatalogItemFactory';
import SubscriptionFactory from '@shared/test_utils/factories/SubscriptionFactory';
import SubscriptionPlanFactory from '@shared/test_utils/factories/SubscriptionPlanFactory';
import UserFactory from '@shared/test_utils/factories/UserFactory';
import '@shared/test_utils/matchers/toEqualInDatabase';
import '@shared/test_utils/matchers/toExistsInTable';
import types from '@shared/types';
import UserTypes from '@shared/UserTypes';
import SubscriberModule from '@subscriber/infra/SubscriberModule';
import { SubscriptionStatus } from '@subscription/domain/Subscription';
import { RecurrenceTypes } from '@subscription/domain/SubscriptionPlan';
import SubscriptionModule from '@subscription/infra/SubscriptionModule';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Subscription E2E tests', () => {
  const application = new Application({
    modules: [
      new GlobalModule(),
      new AuthModule(),
      new SubscriberModule(),
      new CatalogModule(),
      new SubscriptionModule(),
    ]
  });
  const request = supertest(application.server);
  const user_factory = new UserFactory();
  const subscription_plan_factory = new SubscriptionPlanFactory();
  const catalog_item_factory = new CatalogItemFactory();
  const subscription_factory = new SubscriptionFactory();

  afterEach(cleanUpDatabase);

  describe('POST: /api/subscriptions', () => {
    it("returns status code 404 if subscriber doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const response = await request
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send({
          subscriber_id: faker.string.uuid(),
          subscription_plan_id: subscription_plan.id,
          tenant_id: company.id,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinante não encontrado');
    });

    it("returns status code 404 if tenant doesn't exist", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const response = await request
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send({
          subscriber_id: subscriber.id,
          subscription_plan_id: subscription_plan.id,
          tenant_id: faker.string.uuid(),
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 404 if subscription plan doesn't exist", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const response = await request
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send({
          subscriber_id: subscriber.id,
          subscription_plan_id: faker.string.uuid(),
          tenant_id: company.id,
        });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Plano de assinatura não encontrado');
    });

    it("returns status code 400 if data is invalid", async () => {
      const data = {
        subscriber_id: faker.number.int(),
        subscription_plan_id: faker.number.float(),
        tenant_id: faker.string.sample(),
      };

      const response = await request
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(400);
      expect(response.body.errors).toHaveLength(3);
    });

    it("returns status code 201 after subscription creation", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const data = {
        subscriber_id: subscriber.id,
        subscription_plan_id: subscription_plan.id,
        tenant_id: company.id,
      };

      const response = await request
        .post('/api/subscriptions')
        .set('Content-Type', 'application/json')
        .send(data);

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toEqual(SubscriptionStatus.PENDING);
      expect(response.body.subscriber_id).toEqual(data.subscriber_id);
      expect(response.body.subscription_plan_id).toEqual(data.subscription_plan_id);
      expect(response.body.tenant_id).toEqual(data.tenant_id);
      expect(data).toEqualInDatabase('subscriptions', response.body.id);
    });
  });

  describe('PACTH: /api/subscriptions/:subscription_id/activations', () => {
    it("returns status code 404 subscription doesn't exist", async () => {
      const response = await request
        .patch(`/api/subscriptions/${faker.string.uuid()}/activations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinatura não encontrada');
    });

    it("returns status code 204 if it has changed subscription to active", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.PENDING,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/activations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(204);
      expect({ status: SubscriptionStatus.ACTIVE }).toEqualInDatabase('subscriptions', subscription.id!);
    });

    it('should return 422 if subscription already is active', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.ACTIVE,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/activations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura já está ativa');
    });

    it('should return 422 if subscription is canceled', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.CANCELED,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/activations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura já está cancelada');
    });

    it('should return 422 if subscription is finished', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.FINISHED,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/activations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura já está finalizada');
    });
  });

  describe('PACTH: /api/subscriptions/:subscription_id/pauses', () => {
    it("returns status code 404 subscription doesn't exist", async () => {
      const response = await request
        .patch(`/api/subscriptions/${faker.string.uuid()}/pauses`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinatura não encontrada');
    });

    it("returns status code 204 if subscription was paused", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.ACTIVE,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/pauses`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(204);
      expect({ status: SubscriptionStatus.PAUSED }).toEqualInDatabase('subscriptions', subscription.id!);
    });

    it('should return 422 if subscription already is paused', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.PAUSED,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/pauses`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura já está pausada');
    });

    it('should return 422 if subscription is canceled', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.CANCELED,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/pauses`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura já está cancelada');
    });

    it('should return 422 if subscription is finished', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.FINISHED,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/pauses`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura já está finalizada');
    });

    it('should return 422 if subscription still pending', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.PENDING,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/pauses`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura pendente');
    });
  });

  describe('PACTH: /api/subscriptions/:subscription_id/cancellations', () => {
    it("returns status code 404 subscription doesn't exist", async () => {
      const response = await request
        .patch(`/api/subscriptions/${faker.string.uuid()}/cancellations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Assinatura não encontrada');
    });

    it("returns status code 204 if subscription was canceled", async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.ACTIVE,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/cancellations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(204);
      expect({ status: SubscriptionStatus.CANCELED }).toEqualInDatabase('subscriptions', subscription.id!);
    });

    it('should return 422 if subscription already is canceled', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.CANCELED,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/cancellations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura já está cancelada');
    });

    it('should return 422 if subscription is finished', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      const subscription = await subscription_factory.createOne({
        id: faker.string.uuid(),
        status: SubscriptionStatus.FINISHED,
        subscriber_id: subscriber.id!,
        subscription_plan_id: subscription_plan.id!,
        tenant_id: company.id!,
      });

      const response = await request
        .patch(`/api/subscriptions/${subscription.id}/cancellations`)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual('Assinatura já está finalizada');
    });

  });

  describe('POST: /api/subscriptions/plans', () => {
    const company_id = faker.string.uuid();

    beforeAll(async () => {
      const storage = application.container.get<FileStorage>(types.FileStorage);
      await storage.createBucket(`tenant-${company_id}`);
    });

    it('returns status code 400 if term_file is not a PDF', async () => {
      const term_file = readFileSync(resolve(__dirname, './fixtures/test.png'));

      const response = await request
        .post('/api/subscriptions/plans')
        .set('Content-Type', 'multipart/form-data')
        .field('item_ids[]', faker.string.uuid())
        .field('recurrence_type', faker.helpers.enumValue(RecurrenceTypes))
        .field('tenant_id', faker.string.uuid())
        .attach('term_file', term_file, 'test.png');

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('O arquivo precisa ser um PDF');
    });

    it("returns status code 404 if tenant doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: company_id,
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const term_file = readFileSync(resolve(__dirname, './fixtures/test.pdf'));

      const response = await request
        .post('/api/subscriptions/plans')
        .set('Content-Type', 'multipart/form-data')
        .field('item_ids[]', catalog_item.id!)
        .field('recurrence_type', faker.helpers.enumValue(RecurrenceTypes))
        .field('tenant_id', faker.string.uuid())
        .attach('term_file', term_file, 'test.pdf');

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Empresa não encontrada');
    });

    it("returns status code 404 if some catalog item doesn't exist", async () => {
      const company = await user_factory.createOne({
        id: company_id,
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const term_file = readFileSync(resolve(__dirname, './fixtures/test.pdf'));

      const response = await request
        .post('/api/subscriptions/plans')
        .set('Content-Type', 'multipart/form-data')
        .field('item_ids[]', catalog_item.id!)
        .field('item_ids[]', faker.string.uuid())
        .field('recurrence_type', faker.helpers.enumValue(RecurrenceTypes))
        .field('tenant_id', company.id!)
        .attach('term_file', term_file, 'test.pdf');

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Item não encontrado');
    });

    it('creates a subscription plan without term', async () => {
      const company = await user_factory.createOne({
        id: company_id,
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float({ fractionDigits: 2 }),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      const recurrence_type = faker.helpers.enumValue(RecurrenceTypes);

      const response = await request
        .post('/api/subscriptions/plans')
        .set('Content-Type', 'multipart/form-data')
        .field('item_ids[]', catalog_item.id!)
        .field('recurrence_type', recurrence_type)
        .field('tenant_id', company.id!);

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.items[0]).toEqual({
        id: catalog_item.id,
        name: catalog_item.name,
        created_at: catalog_item.created_at!.toISOString(),
        updated_at: catalog_item.updated_at!.toISOString(),
      });
      expect(response.body.amount).toEqual(catalog_item.amount);
      expect(response.body.recurrence_type).toEqual(recurrence_type);
      expect(response.body.tenant_id).toEqual(company.id);
      expect(response.body.term_url).toBeUndefined();
      expect({
        amount: catalog_item.amount,
        tenant_id: company.id,
        term_url: null,
        recurrence_type,
      }).toEqualInDatabase('subscription_plans', response.body.id);
      expect({
        subscription_plan_id: response.body.id,
        item_id: catalog_item.id
      }).toExistsInTable('subscription_plan_items');
    });

    it('creates a subscription plan with a term', async () => {
      const company = await user_factory.createOne({
        id: company_id,
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float({ fractionDigits: 2, min: 10, max: 1000 }),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      const recurrence_type = faker.helpers.enumValue(RecurrenceTypes);
      const term_file = readFileSync(resolve(__dirname, './fixtures/test.pdf'));

      const response = await request
        .post('/api/subscriptions/plans')
        .set('Content-Type', 'multipart/form-data')
        .field('item_ids[]', catalog_item.id!)
        .field('recurrence_type', recurrence_type)
        .field('tenant_id', company.id!)
        .attach('term_file', term_file, 'test.pdf');

      expect(response.status).toEqual(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.items[0]).toEqual({
        id: catalog_item.id,
        name: catalog_item.name,
        created_at: catalog_item.created_at!.toISOString(),
        updated_at: catalog_item.updated_at!.toISOString(),
      });
      expect(response.body.amount).toEqual(catalog_item.amount);
      expect(response.body.recurrence_type).toEqual(recurrence_type);
      expect(response.body.tenant_id).toEqual(company.id);
      expect(response.body.term_url).toEqual(`http://localhost:9000/tenant-${company.id}/subscription_terms/term_${response.body.id}.pdf`);
      expect({
        amount: catalog_item.amount,
        tenant_id: company.id,
        term_url: response.body.term_url,
        recurrence_type,
      }).toEqualInDatabase('subscription_plans', response.body.id);
      expect({
        subscription_plan_id: response.body.id,
        item_id: catalog_item.id
      }).toExistsInTable('subscription_plan_items');
    });
  });

  describe('GET: /api/subscriptions/plans', () => {
    it('should return all subscriptions', async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      await subscription_plan_factory.createMany([
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          items: [{ id: catalog_item.id, name: catalog_item.name }],
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          items: [{ id: catalog_item.id, name: catalog_item.name }],
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          items: [{ id: catalog_item.id, name: catalog_item.name }],
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          items: [{ id: catalog_item.id, name: catalog_item.name }],
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: company.id!,
        },
      ]);

      const response = await request
        .get('/api/subscriptions/plans')
        .query({ tenant_id: company.id })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(4);
      expect(response.body).not.toHaveProperty('page_result');
    });

    it('should return subscription plans with pagination', async () => {
      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      await subscription_plan_factory.createMany([
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          items: [{ id: catalog_item.id, name: catalog_item.name }],
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          items: [{ id: catalog_item.id, name: catalog_item.name }],
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          items: [{ id: catalog_item.id, name: catalog_item.name }],
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          amount: faker.number.float(),
          items: [{ id: catalog_item.id, name: catalog_item.name }],
          recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
          tenant_id: company.id!,
        },
      ]);

      let response = await request
        .get('/api/subscriptions/plans')
        .query({ page: 1, limit: 1, tenant_id: company.id })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(4);

      response = await request
        .get('/api/subscriptions/plans')
        .query({ page: 1, limit: 2, tenant_id: company.id })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get('/api/subscriptions/plans')
        .query({ page: 2, limit: 2, tenant_id: company.id })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(-1);
      expect(response.body.page_result.total_of_pages).toEqual(2);
    });
  });

  describe('GET: /api/subscriptions', () => {
    it('should return all subscriptions', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      await subscription_factory.createMany([
        {
          id: faker.string.uuid(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          subscriber_id: subscriber.id!,
          subscription_plan_id: subscription_plan.id!,
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          subscriber_id: subscriber.id!,
          subscription_plan_id: subscription_plan.id!,
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          subscriber_id: subscriber.id!,
          subscription_plan_id: subscription_plan.id!,
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          subscriber_id: subscriber.id!,
          subscription_plan_id: subscription_plan.id!,
          tenant_id: company.id!,
        },
      ]);

      const response = await request
        .get('/api/subscriptions')
        .query({ tenant_id: company.id })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(4);
      expect(response.body).not.toHaveProperty('page_result');
    });

    it('should return subscriptions with pagination', async () => {
      const subscriber = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(11),
        password: faker.string.alphanumeric(11),
        type: UserTypes.CUSTOMER,
      });

      const company = await user_factory.createOne({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        document: faker.string.numeric(14),
        password: faker.string.alphanumeric(11),
        type: UserTypes.COMPANY,
      });

      const catalog_item = await catalog_item_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        attributes: [{ name: faker.commerce.productAdjective(), description: faker.string.sample() }],
        description: faker.commerce.productDescription(),
        is_service: faker.datatype.boolean(),
        name: faker.commerce.product(),
        tenant_id: company.id!,
        picture_url: faker.internet.url(),
      });

      const subscription_plan = await subscription_plan_factory.createOne({
        id: faker.string.uuid(),
        amount: faker.number.float(),
        items: [{ id: catalog_item.id, name: catalog_item.name }],
        recurrence_type: faker.helpers.enumValue(RecurrenceTypes),
        tenant_id: company.id!,
      });

      await subscription_factory.createMany([
        {
          id: faker.string.uuid(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          subscriber_id: subscriber.id!,
          subscription_plan_id: subscription_plan.id!,
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          subscriber_id: subscriber.id!,
          subscription_plan_id: subscription_plan.id!,
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          subscriber_id: subscriber.id!,
          subscription_plan_id: subscription_plan.id!,
          tenant_id: company.id!,
        },
        {
          id: faker.string.uuid(),
          status: faker.helpers.enumValue(SubscriptionStatus),
          subscriber_id: subscriber.id!,
          subscription_plan_id: subscription_plan.id!,
          tenant_id: company.id!,
        },
      ]);

      let response = await request
        .get('/api/subscriptions')
        .query({ page: 1, limit: 1, tenant_id: company.id })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(4);

      response = await request
        .get('/api/subscriptions')
        .query({ page: 1, limit: 2, tenant_id: company.id })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(2);
      expect(response.body.page_result.total_of_pages).toEqual(2);

      response = await request
        .get('/api/subscriptions')
        .query({ page: 2, limit: 2, tenant_id: company.id })
        .set('Content-Type', 'application/json')
        .send();

      expect(response.status).toEqual(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.page_result.next_page).toEqual(-1);
      expect(response.body.page_result.total_of_pages).toEqual(2);
    });
  });
});
