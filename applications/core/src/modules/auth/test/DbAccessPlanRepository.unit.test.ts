import AccessPlan, { AccessPlanTypes } from "@auth/domain/AccessPlan";
import DbAccessPlanRepository from "@auth/infra/persistence/DbAccessPlanRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/Database";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbAccessPlanRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbAccessPlanRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbAccessPlanRepository.getAccessPlans', () => {
    it('returns a collection of access plans', async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: faker.string.uuid(),
            active: true,
            amount: faker.number.float(),
            type: AccessPlanTypes.MONTHLY,
            description: faker.lorem.lines(),
          },
          {
            id: faker.string.uuid(),
            active: true,
            amount: faker.number.float(),
            type: AccessPlanTypes.MONTHLY,
            description: faker.lorem.lines(),
          },
          {
            id: faker.string.uuid(),
            active: true,
            amount: faker.number.float(),
            type: AccessPlanTypes.MONTHLY,
            description: faker.lorem.lines(),
          }
        ]
      });

      const collection = await repository.getAccessPlans();

      expect(collection.items).toHaveLength(3);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM access_plans'
      );
    });
  });

  describe('DbAccessPlanRepository.getAccessPlanById', () => {
    it('returns an access plan', async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: faker.string.uuid(),
            active: true,
            amount: faker.number.float(),
            type: AccessPlanTypes.MONTHLY,
            description: faker.lorem.lines(),
          },
        ]
      });

      const access_plan_id = faker.string.uuid();
      const access_plan = await repository.getAccessPlanById(access_plan_id);

      expect(access_plan).toBeInstanceOf(AccessPlan);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM access_plans WHERE id = $1',
        [access_plan_id]
      );
    });

    it("returns NULL if access plan doesn't exist", async () => {
      query_mock.mockResolvedValueOnce({
        rows: []
      });

      const access_plan_id = faker.string.uuid();
      const access_plan = await repository.getAccessPlanById(access_plan_id);

      expect(access_plan).toBeNull();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM access_plans WHERE id = $1',
        [access_plan_id]
      );
    });
  });

  describe('DbAccessPlanRepository.createAccessPlan', () => {
    it('creates a new access plan', async () => {
      const access_plan = new AccessPlan({
        id: faker.string.uuid(),
        active: true,
        amount: faker.number.float(),
        type: AccessPlanTypes.MONTHLY,
        description: faker.lorem.lines(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      const access_plan_obj = access_plan.toObject();

      await repository.createAccessPlan(access_plan);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO access_plans (id,amount,type,description,active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          access_plan_obj.id,
          access_plan_obj.amount,
          access_plan_obj.type,
          access_plan_obj.description,
          access_plan_obj.active,
          access_plan_obj.created_at,
          access_plan_obj.updated_at,
        ]
      );
    });
  });

  describe('DbAccessPlanRepository.updateAccessPlan', () => {
    it('updates an access plan', async () => {
      const access_plan = new AccessPlan({
        id: faker.string.uuid(),
        active: true,
        amount: faker.number.float(),
        type: AccessPlanTypes.MONTHLY,
        description: faker.lorem.lines(),
        created_at: faker.date.future(),
        updated_at: faker.date.future(),
      });

      const access_plan_obj = access_plan.toObject();

      await repository.updateAccessPlan(access_plan);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE access_plans SET active=$2,amount=$3,type=$4,description=$5,updated_at=$6 WHERE id=$1',
        [
          access_plan_obj.id,
          access_plan_obj.active,
          access_plan_obj.amount,
          access_plan_obj.type,
          access_plan_obj.description,
          access_plan_obj.updated_at
        ]
      );
    });
  });
});
