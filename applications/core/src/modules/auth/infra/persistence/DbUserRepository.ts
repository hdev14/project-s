import UserRepository, { UsersFilter } from "@auth/app/UserRepository";
import User, { UserObject } from "@auth/domain/User";
import Database from "@shared/infra/Database";
import DbUtils from "@shared/utils/DbUtils";
import Pagination, { PaginatedResult } from "@shared/utils/Pagination";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';

@injectable()
export default class DbUserRepository implements UserRepository {
  #db: Pool;
  #select_users_query = 'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug, u.tenant_id FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id';
  #count_select_users_query = 'SELECT DISTINCT count(u.id) as total FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id';

  constructor() {
    this.#db = Database.connect();
  }

  async getUsers(filter?: UsersFilter): Promise<PaginatedResult<User>> {
    const { result, total } = await this.selectUsers(filter);

    const page_result = (total !== undefined && total > 0)
      ? Pagination.calculatePageResult(total, filter!.page_options!)
      : undefined;

    const user_objects = new Map<string, UserObject>();

    for (let idx = 0; idx < result.rows.length; idx++) {
      const row = result.rows[idx];

      if (user_objects.has(row.id)) {
        const existent_user = user_objects.get(row.id);
        if (row.slug) {
          existent_user!.policies.push(row.slug);
        }
        user_objects.set(row.id, existent_user!);
        continue;
      }

      const policies = row.slug ? [row.slug] : [];

      user_objects.set(row.id, {
        id: row.id,
        email: row.email,
        password: row.password,
        access_plan_id: row.access_plan_id,
        policies,
        tenant_id: row.tenant_id,
      });
    }

    const results = [];

    for (const user_obj of user_objects.values()) {
      results.push(new User(user_obj));
    }

    return { results, page_result };
  }

  private async selectUsers(filter?: UsersFilter) {
    if (filter) {
      const count_query = filter.tenant_id ? this.#count_select_users_query + ' WHERE u.tenant_id=$1' : this.#count_select_users_query;
      const query = filter.tenant_id ? this.#select_users_query + ' WHERE u.tenant_id=$1' : this.#select_users_query;
      const values: unknown[] = [filter.tenant_id];

      if (filter.page_options) {
        const offset = Pagination.calculateOffset(filter.page_options);
        const total_result = await this.#db.query(count_query, DbUtils.sanitizeValues(values));

        const paginated_query = filter.tenant_id ? query + ' LIMIT $2 OFFSET $3' : query + ' LIMIT $1 OFFSET $2';

        const result = await this.#db.query(
          paginated_query,
          DbUtils.sanitizeValues(values.concat([filter.page_options.limit, offset]))
        );

        return { result, total: total_result.rows[0].total };
      }

      return { result: await this.#db.query(query, DbUtils.sanitizeValues(values)) };

    }

    return { result: await this.#db.query(this.#select_users_query) };
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
        policies.push(result.rows[idx].slug);
      }
    }

    return new User({
      id: result.rows[0].id,
      email: result.rows[0].email,
      password: result.rows[0].password,
      access_plan_id: result.rows[0].access_plan_id,
      policies,
      tenant_id: result.rows[0].tenant_id,
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
      tenant_id: result.rows[0].tenant_id
    });
  }

  async createUser(user: User): Promise<void> {
    const user_obj = user.toObject();
    const insert_obj = {
      id: user_obj.id,
      email: user_obj.email,
      password: user_obj.password,
      access_plan_id: user_obj.access_plan_id,
      tenant_id: user_obj.tenant_id
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
    const data = Object.assign({}, user_obj, { policies: undefined });

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

    let user_policy_values = '';

    const policy_ids = [];

    for (let idx = 1; idx <= policy_result.rows.length; idx++) {
      policy_ids.push(policy_result.rows[idx - 1].id);

      if (idx !== policy_result.rows.length) {
        user_policy_values += `($1, $${idx + 1}), `;
        continue;
      }

      user_policy_values += `($1, $${idx + 1})`;
    }

    await this.#db.query(
      `INSERT INTO user_policies (user_id, policy_id) VALUES ${user_policy_values}`,
      [user_id].concat(policy_ids)
    );
  }
}
