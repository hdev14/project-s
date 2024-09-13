import User from "@auth/domain/User";
import DbUserRepository from "@auth/infra/persistence/DbUserRepository";
import { faker } from '@faker-js/faker/locale/pt_BR';
import Database from "@shared/Database";
import UserTypes from "@shared/UserTypes";
import { PageOptions } from "@shared/utils/Pagination";

const connect_spy = jest.spyOn(Database, 'connect');
const query_mock = jest.fn();

describe('DbUserRepository unit tests', () => {
  connect_spy.mockImplementation(() => ({ query: query_mock }) as never);
  const repository = new DbUserRepository();

  afterAll(() => {
    connect_spy.mockClear();
  });

  afterEach(() => {
    query_mock.mockReset();
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

      const { results, page_result } = await repository.getUsers();

      expect(results).toHaveLength(2);
      expect(page_result).toBeUndefined();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id'
      );
    });

    it('returns a list of users when the limit of pagination is 1 and the page is 1', async () => {
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

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
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
          ]
        });

      const page_options: PageOptions = {
        limit: 1,
        page: 1,
      };

      const { results, page_result } = await repository.getUsers({ page_options });

      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(2);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM users',
        []
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id LIMIT $1 OFFSET $2',
        [page_options.limit, 0],
      );
    });

    it('returns a list of users when the limit of pagination is 1 and the page is 2', async () => {
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

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
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
          ]
        });

      const page_options: PageOptions = {
        limit: 1,
        page: 2,
      };

      const { results, page_result } = await repository.getUsers({ page_options });

      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(-1);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM users',
        []
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id LIMIT $1 OFFSET $2',
        [page_options.limit, 1],
      );
    });

    it('returns a list of users filtered by tenant_id', async () => {
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

      const tenant_id = faker.string.uuid();
      const { results, page_result } = await repository.getUsers({ tenant_id });

      expect(results).toHaveLength(2);
      expect(page_result).toBeUndefined();
      expect(query_mock).toHaveBeenCalledWith(
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE u.tenant_id=$1',
        [tenant_id]
      );
    });

    it('returns a list of users when the limit of pagination is 1, the page is 2 and is filtered by tenant_id', async () => {
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

      query_mock
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
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
          ]
        });

      const tenant_id = faker.string.uuid();
      const page_options: PageOptions = {
        limit: 1,
        page: 2,
      };

      const { results, page_result } = await repository.getUsers({ tenant_id, page_options });

      expect(results).toHaveLength(1);
      expect(page_result!.next_page).toEqual(-1);
      expect(page_result!.total_of_pages).toEqual(2);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'SELECT count(id) as total FROM users WHERE tenant_id=$1',
        [tenant_id]
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE u.tenant_id=$1 LIMIT $2 OFFSET $3',
        [tenant_id, page_options.limit, 1],
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
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE u.id = $1',
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
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE u.id = $1',
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
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE email = $1',
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
        'SELECT u.id,u.email,u.password,u.access_plan_id,p.slug,u.tenant_id,u.type FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id WHERE email = $1',
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
        tenant_id: faker.string.uuid(),
        type: faker.helpers.enumValue(UserTypes),
      };

      const user = new User(user_obj);

      await repository.createUser(user);

      expect(query_mock).toHaveBeenCalledTimes(3);
      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'INSERT INTO users (id,email,password,access_plan_id,tenant_id,type) VALUES ($1,$2,$3,$4,$5,$6)',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.access_plan_id, user_obj.tenant_id, user_obj.type],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        `SELECT id FROM policies WHERE slug IN ($1,$2)`,
        policies,
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        3,
        'INSERT INTO user_policies (user_id, policy_id) VALUES ($1,$2), ($1,$3)',
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
        type: faker.helpers.enumValue(UserTypes),
      };

      const user = new User(user_obj);

      await repository.createUser(user);

      expect(query_mock).toHaveBeenCalledTimes(1);
      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO users (id,email,password,access_plan_id,type) VALUES ($1,$2,$3,$4,$5)',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.access_plan_id, user_obj.type],
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
        tenant_id: faker.string.uuid(),
        type: faker.helpers.enumValue(UserTypes),
      };

      const user = new User(user_obj);

      await repository.createUser(user);

      expect(query_mock).toHaveBeenCalledTimes(1);
      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO users (id,email,password,tenant_id,type) VALUES ($1,$2,$3,$4,$5)',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.tenant_id, user_obj.type],
      );
    });

    it("should ignore the tenant_id when it is passed as undefined", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const user_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        access_plan_id: faker.string.uuid(),
        type: faker.helpers.enumValue(UserTypes),
      };

      const user = new User(user_obj);

      await repository.createUser(user);

      expect(query_mock).toHaveBeenCalledTimes(1);
      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO users (id,email,password,access_plan_id,type) VALUES ($1,$2,$3,$4,$5)',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.access_plan_id, user_obj.type],
      );
    });

    it("should ignore both tenant_id and access_plan_id", async () => {
      query_mock
        .mockResolvedValueOnce({});

      const user_obj = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.string.alphanumeric(),
        policies: [],
        type: faker.helpers.enumValue(UserTypes),
      };

      const user = new User(user_obj);

      await repository.createUser(user);

      expect(query_mock).toHaveBeenCalledTimes(1);
      expect(query_mock).toHaveBeenCalledWith(
        'INSERT INTO users (id,email,password,type) VALUES ($1,$2,$3,$4)',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.type],
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
        type: faker.helpers.enumValue(UserTypes),
      };

      const user = new User(user_obj);

      await repository.updateUser(user);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE users SET email=$2,password=$3,access_plan_id=$4,type=$5 WHERE id = $1',
        [
          user_obj.id,
          user_obj.email,
          user_obj.password,
          user_obj.access_plan_id,
          user_obj.type,
        ],
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
        type: faker.helpers.enumValue(UserTypes),
      };

      const user = new User(user_obj);

      await repository.updateUser(user);

      expect(query_mock).toHaveBeenCalledWith(
        'UPDATE users SET email=$2,password=$3,type=$4 WHERE id = $1',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.type],
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
        type: faker.helpers.enumValue(UserTypes),
      };

      const user = new User(user_obj);

      await repository.updateUser(user);

      expect(query_mock).toHaveBeenNthCalledWith(
        1,
        'UPDATE users SET email=$2,password=$3,type=$4 WHERE id = $1',
        [user_obj.id, user_obj.email, user_obj.password, user_obj.type],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM user_policies WHERE user_id = $1',
        [user_obj.id],
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        3,
        'SELECT id FROM policies WHERE slug IN ($1,$2)',
        policies,
      );
      expect(query_mock).toHaveBeenNthCalledWith(
        4,
        'INSERT INTO user_policies (user_id, policy_id) VALUES ($1,$2), ($1,$3)',
        [user_obj.id, rows[0].id, rows[1].id],
      );
    });
  });
});
