import Database from "@shared/infra/Database";
import DbSubscriptionPlanRepository from "@subscription/infra/DbSubscriptionPlanRepository";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbSubscriptionPlanRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbSubscriptionPlanRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  it.todo('DbSubscriptionPlanRepository.getSubscriptionPlans');

  it.todo('DbSubscriptionPlanRepository.getSubscriptionPlanById');

  it.todo('DbSubscriptionPlanRepository.createSubscriptionPlan');
});
