import Policy from "@auth/domain/Policy";
import DbPolicyRepository from "@auth/infra/persistence/DbPolicyRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/Database";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbPolicyRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbPolicyRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
  });

  describe('DbPolicyRepository.getPolicies', () => {
    it('returns a list of policies', async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: faker.string.uuid(),
            description: faker.lorem.lines(),
            slug: faker.word.verb(),
          },
          {
            id: faker.string.uuid(),
            description: faker.lorem.lines(),
            slug: faker.word.verb(),
          },
          {
            id: faker.string.uuid(),
            description: faker.lorem.lines(),
            slug: faker.word.verb(),
          },
        ]
      });

      const policies = await repository.getPolicies();

      expect(policies[0]).toBeInstanceOf(Policy);
      expect(policies).toHaveLength(3);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM policies',
        []
      );
    });

    it('returns a list of policies filtered by slugs', async () => {
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: faker.string.uuid(),
            description: faker.lorem.lines(),
            slug: faker.word.verb(),
          },
          {
            id: faker.string.uuid(),
            description: faker.lorem.lines(),
            slug: faker.word.verb(),
          },
          {
            id: faker.string.uuid(),
            description: faker.lorem.lines(),
            slug: faker.word.verb(),
          },
        ]
      });

      const slugs = [faker.word.verb(), faker.word.verb(), faker.word.verb()];
      const policies = await repository.getPolicies({
        slugs,
      });

      expect(policies[0]).toBeInstanceOf(Policy);
      expect(policies).toHaveLength(3);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM policies WHERE slug IN ($1, $2, $3)',
        slugs,
      );
    });
  });

  describe('DbPolicyRepository.getPolicyBySlug', () => {
    it('get a policy by slug', async () => {
      const slug = faker.word.verb();

      query_mock.mockResolvedValueOnce({
        rows: [{
          id: faker.string.uuid(),
          description: faker.lorem.lines(),
          slug,
        }]
      });

      const policy = await repository.getPolicyBySlug(slug);

      expect(policy).toBeInstanceOf(Policy);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM policies WHERE slug=$1',
        [slug]
      );
    });

    it("returns NULL if policy doesn't exist", async () => {
      const slug = faker.word.verb();

      query_mock.mockResolvedValueOnce({
        rows: []
      });

      const policy = await repository.getPolicyBySlug(slug);

      expect(policy).toBeNull();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT * FROM policies WHERE slug=$1',
        [slug]
      );
    });
  });

  describe('DbPolicyRepository.createPolicy', () => {
    it('creates a new policy', async () => {
      const policy_obj = {
        id: faker.string.uuid(),
        slug: faker.word.verb(),
        description: faker.lorem.lines(),
      };

      const policy = new Policy(policy_obj);

      await repository.createPolicy(policy);

      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO policies(id, slug, description) VALUES($1, $2, $3)',
        [policy_obj.id, policy_obj.slug, policy_obj.description]
      );
    });
  });

  describe('DbPolicyRepository.deletePolicy', () => {
    it('deletes a policy', async () => {
      const policy_id = faker.string.uuid();

      await repository.deletePolicy(policy_id);

      expect(query_mock).toHaveBeenCalledWith(
        'DELETE FROM policies WHERE id=$1',
        [policy_id]
      );
    });
  });
});