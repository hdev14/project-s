import UserRepository, { UsersFilter } from "@auth/app/UserRepository";
import User, { UserProps } from "@auth/domain/User";
import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';

@injectable()
export default class DbUserRepository implements UserRepository {
  #db: Pool;
  #columns = [
    'u.id',
    'u.email',
    'u.password',
    'u.access_plan_id',
    'p.slug',
    'u.tenant_id',
    'u.type',
    'u.created_at',
    'u.updated_at',
  ];
  #select_users_query = `SELECT ${this.#columns.toString()} FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id`;
  #count_select_users_query = 'SELECT count(id) as total FROM users';

  constructor() {
    this.#db = Database.connect();
  }

  async getUsers(filter?: UsersFilter): Promise<PaginatedResult<UserProps>> {
    const { rows, page_result } = await this.selectUsers(filter);

    const user_objs: Record<string, UserProps> = {};

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const user_obj = user_objs[row.id];

      if (user_obj && row.slug) {
        user_obj.policies.push(row.slug);
        continue;
      }

      const policies = row.slug ? [row.slug] : [];

      user_objs[row.id] = {
        id: row.id,
        email: row.email,
        password: row.password,
        access_plan_id: row.access_plan_id,
        policies,
        tenant_id: row.tenant_id,
        type: row.type,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }

    return { results: Object.values(user_objs), page_result };
  }

  private async selectUsers(filter?: UsersFilter) {
    if (filter) {
      const count_query = filter.tenant_id ? this.#count_select_users_query + ' WHERE tenant_id=$1' : this.#count_select_users_query;
      const query = filter.tenant_id ? this.#select_users_query + ' WHERE u.tenant_id=$1' : this.#select_users_query;
      const values: unknown[] = [filter.tenant_id];

      if (filter.page_options) {
        const offset = Pagination.calculateOffset(filter.page_options);

        const count_result = await this.#db.query(count_query, DbUtils.sanitizeValues(values));

        const paginated_query = filter.tenant_id ? query + ' LIMIT $2 OFFSET $3' : query + ' LIMIT $1 OFFSET $2';

        const { rows } = await this.#db.query(
          paginated_query,
          DbUtils.sanitizeValues(values.concat([filter.page_options.limit, offset]))
        );

        const page_result = (count_result.rows[0].total !== undefined && count_result.rows[0].total > 0)
          ? Pagination.calculatePageResult(count_result.rows[0].total, filter!.page_options!)
          : undefined;

        return { rows, page_result };
      }

      const { rows } = await this.#db.query(query, DbUtils.sanitizeValues(values));

      return { rows };
    }

    const { rows } = await this.#db.query(this.#select_users_query)

    return { rows };
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.#db.query(this.#select_users_query + ' WHERE u.id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const policies = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      const row = result.rows[idx];
      if (row.slug) {
        policies.push(row.slug);
      }
    }

    return new User({
      id: result.rows[0].id,
      email: result.rows[0].email,
      password: result.rows[0].password,
      access_plan_id: result.rows[0].access_plan_id,
      policies,
      tenant_id: result.rows[0].tenant_id,
      type: result.rows[0].type,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.#db.query(this.#select_users_query + ' WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return null;
    }

    const policies = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      policies.push(result.rows[idx].slug);
    }

    return new User({
      id: result.rows[0].id,
      email: result.rows[0].email,
      password: result.rows[0].password,
      access_plan_id: result.rows[0].access_plan_id,
      policies,
      tenant_id: result.rows[0].tenant_id,
      type: result.rows[0].type,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at
    });
  }

  async createUser(user: User): Promise<void> {
    const user_obj = user.toObject();
    const insert_obj = {
      id: user_obj.id,
      email: user_obj.email,
      password: user_obj.password,
      access_plan_id: user_obj.access_plan_id,
      tenant_id: user_obj.tenant_id,
      type: user_obj.type,
      created_at: user_obj.created_at,
      updated_at: user_obj.updated_at,
    };

    const values = Object.values(insert_obj)

    const query = `INSERT INTO users ${DbUtils.columns(insert_obj)} VALUES ${DbUtils.values(values)}`;

    await this.#db.query(query, DbUtils.sanitizeValues(values));

    const has_policies = user_obj.policies.length > 0;

    if (has_policies) {
      await this.insertUserPolicies(user_obj.id, user_obj.policies);
    }
  }

  async updateUser(user: User): Promise<void> {
    const user_obj = user.toObject();
    const data = Object.assign({}, user_obj, { created_at: undefined, policies: undefined });

    const query = `UPDATE users SET ${DbUtils.setColumns(data)} WHERE id = $1`;

    await this.#db.query(query, DbUtils.sanitizeValues(Object.values(data)));

    const has_policies = user_obj.policies.length > 0;

    await this.#db.query('DELETE FROM user_policies WHERE user_id = $1', [user_obj.id]);

    if (has_policies) {
      await this.insertUserPolicies(user_obj.id, user_obj.policies);
    }
  }

  private async insertUserPolicies(user_id: string, policies: Array<string>) {
    const in_operator = DbUtils.inOperator(policies);

    const policy_result = await this.#db.query(
      `SELECT id FROM policies WHERE slug ${in_operator}`,
      policies
    );

    const { ids, string_values } = DbUtils.manyToManyValues(policy_result.rows);

    await this.#db.query(
      `INSERT INTO user_policies (user_id, policy_id) VALUES ${string_values}`,
      [user_id].concat(ids)
    );
  }
}
