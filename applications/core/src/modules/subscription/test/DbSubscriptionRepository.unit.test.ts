import Database from "@shared/infra/Database";
import DbSubscriptionRepository from "@subscription/infra/DbSubscriptionRepository";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbSubscriptionRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbSubscriptionRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  it.todo('DbSubscriptionRepository.createSubscription');

  it.todo('DbSubscriptionRepository.updateSubscription');

  it.todo('DbSubscriptionRepository.getSubscriptionById');

  it.todo('DbSubscriptionRepository.getSubscriptions');
});
