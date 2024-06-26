import UserRepository from "@auth/app/UserRepository";
import User, { UserObject } from "@auth/domain/User";
import Database from "@shared/Database";
import DbOperator from "@shared/utils/DbOperator";
import Pagination, { PageOptions, PaginatedResult } from "@shared/utils/Pagination";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';

@injectable()
export default class DbUserRepository implements UserRepository {
  #db: Pool;
  #select_users_query = 'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id';
  #count_select_users_query = 'SELECT DISTINCT count(u.id) as total FROM users u LEFT JOIN user_policies up ON u.id = up.user_id LEFT JOIN policies p ON up.policy_id = p.id';

  constructor() {
    this.#db = Database.connect();
  }

  async getUsers(page_options?: PageOptions): Promise<PaginatedResult<User>> {
    const { result, total } = await this.selectUsers(page_options);

    const page_result = (total !== undefined && total > 0)
      ? Pagination.calculatePageResult(total, page_options!)
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
        policies
      });
    }

    const results = [];

    for (const user_obj of user_objects.values()) {
      results.push(new User(user_obj));
    }

    return { results, page_result };
  }

  private async selectUsers(pagination?: PageOptions) {
    if (pagination) {
      const offset = Pagination.calculateOffset(pagination);
      const total_result = await this.#db.query(this.#count_select_users_query);

      const result = await this.#db.query(
        this.#select_users_query + ' LIMIT $1 OFFSET $2',
        [pagination.limit, offset]
      );

      return { result, total: total_result.rows[0].total };
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
    });
  }

  async createUser(user: User): Promise<void> {
    const user_obj = user.toObject();

    const query = user_obj.access_plan_id !== undefined
      ? 'INSERT INTO users (id, email, password, access_plan_id) VALUES ($1, $2, $3, $4)'
      : 'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)';

    const values = user_obj.access_plan_id !== undefined
      ? [user_obj.id, user_obj.email, user_obj.password, user_obj.access_plan_id]
      : [user_obj.id, user_obj.email, user_obj.password];

    await this.#db.query(query, values);

    const has_policies = user_obj.policies.length > 0;

    if (has_policies) {
      await this.insertUserPolicies(user_obj.id, user_obj.policies);
    }
  }

  async updateUser(user: User): Promise<void> {
    const user_obj = user.toObject();

    const query = user_obj.access_plan_id !== undefined
      ? 'UPDATE users SET email=$2, password=$3, access_plan_id=$4 WHERE id = $1'
      : 'UPDATE users SET email=$2, password=$3 WHERE id = $1';

    const values = user_obj.access_plan_id !== undefined
      ? [user_obj.id, user_obj.email, user_obj.password, user_obj.access_plan_id]
      : [user_obj.id, user_obj.email, user_obj.password];

    await this.#db.query(query, values);

    const has_policies = user_obj.policies.length > 0;

    if (has_policies) {
      await this.#db.query('DELETE FROM user_policies WHERE user_id = $1', [user_obj.id]);
      await this.insertUserPolicies(user_obj.id, user_obj.policies);
    }
  }

  private async insertUserPolicies(user_id: string, policies: Array<string>) {
    const in_operator = DbOperator.IN(policies);

    const policy_result = await this.#db.query(
      `SELECT id FROM policies WHERE slug IN ${in_operator}`,
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
