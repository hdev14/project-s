import User from "@auth/domain/User";
import DbUserRepository from "@auth/infra/persistence/DbUserRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/Database";
import { PaginationOptions } from "@shared/utils/Pagination";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbUserRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbUserRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockClear();
  });

  describe('DbUserRepository.getUsers', () => {
    it('returns a list of users', async () => {
      const data = [
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(),
          access_plan_id: faker.string.uuid(),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(),
          access_plan_id: faker.string.uuid(),
        }
      ];
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: data[0].id,
            email: data[0].email,
            password: data[0].password,
            access_plan_id: data[0].access_plan_id,
            slug: faker.word.verb(),
          },
          {
            id: data[0].id,
            email: data[0].email,
            password: data[0].password,
            access_plan_id: data[0].access_plan_id,
            slug: faker.word.verb(),
          },
          {
            id: data[1].id,
            email: data[1].email,
            password: data[1].password,
            access_plan_id: data[1].access_plan_id,
            slug: faker.word.verb(),
          },
        ]
      });

      const users = await repository.getUsers();

      expect(users[0]).toBeInstanceOf(User);
      expect(users).toHaveLength(2);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id'
      );
    });

    it('returns a list of users when the limit of pagination is 10 and the page is 1', async () => {
      const data = [
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(),
          access_plan_id: faker.string.uuid(),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(),
          access_plan_id: faker.string.uuid(),
        }
      ];
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: data[0].id,
            email: data[0].email,
            password: data[0].password,
            access_plan_id: data[0].access_plan_id,
            slug: faker.word.verb(),
          },
          {
            id: data[0].id,
            email: data[0].email,
            password: data[0].password,
            access_plan_id: data[0].access_plan_id,
            slug: faker.word.verb(),
          },
          {
            id: data[1].id,
            email: data[1].email,
            password: data[1].password,
            access_plan_id: data[1].access_plan_id,
            slug: faker.word.verb(),
          },
        ]
      });

      const pagination: PaginationOptions = {
        limit: 10,
        page: 1,
      };

      const users = await repository.getUsers(pagination);

      expect(users[0]).toBeInstanceOf(User);
      expect(users).toHaveLength(2);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id LIMIT $1 OFFSET $2',
        [pagination.limit, 0],
      );
    });

    it('returns a list of users when the limit of pagination is 10 and the page is 2', async () => {
      const data = [
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(),
          access_plan_id: faker.string.uuid(),
        },
        {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          password: faker.string.alphanumeric(),
          access_plan_id: faker.string.uuid(),
        }
      ];
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: data[0].id,
            email: data[0].email,
            password: data[0].password,
            access_plan_id: data[0].access_plan_id,
            slug: faker.word.verb(),
          },
          {
            id: data[0].id,
            email: data[0].email,
            password: data[0].password,
            access_plan_id: data[0].access_plan_id,
            slug: faker.word.verb(),
          },
          {
            id: data[1].id,
            email: data[1].email,
            password: data[1].password,
            access_plan_id: data[1].access_plan_id,
            slug: faker.word.verb(),
          },
        ]
      });

      const pagination: PaginationOptions = {
        limit: 10,
        page: 2,
      };

      const users = await repository.getUsers(pagination);

      expect(users[0]).toBeInstanceOf(User);
      expect(users).toHaveLength(2);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id LIMIT $1 OFFSET $2',
        [pagination.limit, 10],
      );
    });
  });

  describe('DbUserRepository.getUserById', () => {
    it('returns an user by id', async () => {
      const data = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        access_plan_id: faker.string.uuid(),
      };
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: data.id,
            email: data.email,
            password: data.password,
            access_plan_id: data.access_plan_id,
            slug: faker.word.verb(),
          },
          {
            id: data.id,
            email: data.email,
            password: data.password,
            access_plan_id: data.access_plan_id,
            slug: faker.word.verb(),
          },
        ]
      });


      const user = await repository.getUserById(data.id);

      expect(user).toBeInstanceOf(User);
      expect(user?.toObject().policies).toHaveLength(2);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE u.id = $1',
        [data.id]
      );
    });

    it("returns NULL if user doesn't exist", async () => {
      query_mock.mockResolvedValueOnce({
        rows: []
      });

      const user_id = faker.string.uuid();
      const user = await repository.getUserById(user_id);

      expect(user).toBeNull()
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE u.id = $1',
        [user_id]
      );
    });
  });

  describe('DbUserRepository.getUserByEmail', () => {
    it('returns an user by email', async () => {
      const data = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        access_plan_id: faker.string.uuid(),
      };
      query_mock.mockResolvedValueOnce({
        rows: [
          {
            id: data.id,
            email: data.email,
            password: data.password,
            access_plan_id: data.access_plan_id,
            slug: faker.word.verb(),
          },
          {
            id: data.id,
            email: data.email,
            password: data.password,
            access_plan_id: data.access_plan_id,
            slug: faker.word.verb(),
          },
        ]
      });

      const user = await repository.getUserByEmail(data.email);

      expect(user).toBeInstanceOf(User);
      expect(user?.toObject().policies).toHaveLength(2);
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE email = $1',
        [data.email]
      );
    });

    it("returns NULL if user doesn't exist", async () => {
      query_mock.mockResolvedValueOnce({
        rows: []
      });

      const user_email = faker.internet.email();
      const user = await repository.getUserByEmail(user_email);

      expect(user).toBeNull()
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE email = $1',
        [user_email]
      );
    });
  });

  describe('DbUserRepository.createUser', () => {
    it('creates an user', async () => {
      const policies = [faker.word.verb(), faker.word.verb()];
      const rows = [
        {
          id: faker.string.uuid(),
        },
        {
          id: faker.string.uuid(),
        }
      ];

      query_mock
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows });

      const user_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies,
        access_plan_id: faker.string.uuid(),
      };

      const user = new User(user_obj);

      await repository.createUser(user);

      expect(query_mock).toHaveBeenCalledTimes(3);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'INSERT INTO users (id, email, password, access_plan_id) VALUES ($1, $2, $3, $4)',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.access_plan_id],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        `SELECT id FROM policies WHERE slug IN ($1, $2)`,
        policies,
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        3,
        'INSERT INTO user_policies (user_id, policy_id) VALUES ($1, $2), ($1, $3)',
        [user_obj.id, rows[0].id, rows[1].id],
      );
    });

    it("doesn't insert policies if user doesn't have any policy attached", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const user_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        access_plan_id: faker.string.uuid(),
      };

      const user = new User(user_obj);

      await repository.createUser(user);

      expect(query_mock).toHaveBeenCalledTimes(1);
      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO users (id, email, password, access_plan_id) VALUES ($1, $2, $3, $4)',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.access_plan_id],
      );
    });

    it("should ignore the access_plan_id when it is passed as undefined", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const user_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
      };

      const user = new User(user_obj);

      await repository.createUser(user);

      expect(query_mock).toHaveBeenCalledTimes(1);
      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
        [user_obj.id, user_obj.email, user_obj.password],
      );
    });
  });

  describe('DbUserRepository.updateUser', () => {
    it("updates an user", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const user_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        access_plan_id: faker.string.uuid(),
        policies: [],
      };

      const user = new User(user_obj);

      await repository.updateUser(user);

      expect(query_mock).toHaveBeenCalledTimes(1);
      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE users SET email=$2, password=$3, access_plan_id=$4 WHERE id = $1',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.access_plan_id],
      );
    });

    it("updates an user without access_plan_id", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const user_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
      };

      const user = new User(user_obj);

      await repository.updateUser(user);

      expect(query_mock).toHaveBeenCalledTimes(1);
      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE users SET email=$2, password=$3 WHERE id = $1',
        [user_obj.id, user_obj.email, user_obj.password],
      );
    });

    it("updates an user with policies", async () => {
      const policies = [faker.word.verb(), faker.word.verb()];
      const rows = [
        {
          id: faker.string.uuid(),
        },
        {
          id: faker.string.uuid(),
        }
      ];
      query_mock
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows })
        .mockResolvedValueOnce({});


      const user_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies,
      };

      const user = new User(user_obj);

      await repository.updateUser(user);

      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'UPDATE users SET email=$2, password=$3 WHERE id = $1',
        [user_obj.id, user_obj.email, user_obj.password],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM user_policies WHERE user_id = $1',
        [user_obj.id],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        3,
        'SELECT id FROM policies WHERE slug IN ($1, $2)',
        policies,
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        4,
        'INSERT INTO user_policies (user_id, policy_id) VALUES ($1, $2), ($1, $3)',
        [user_obj.id, rows[0].id, rows[1].id],
      );
    });
  });
});