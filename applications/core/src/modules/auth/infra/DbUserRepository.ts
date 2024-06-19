import UserRepository from "@auth/app/UserRepository";
import User, { UserObject } from "@auth/domain/User";
import Database from "@shared/Database";
import Pagination, { PaginationOptions } from "@shared/utils/Pagination";
import { Pool } from "pg";

export default class DbUserRepository implements UserRepository {
  #db: Pool;
  #default_query = 'SELECT u.id, u.email, u.password, u.access_plan_id, p.slug FROM users AS u JOIN user_policies AS up ON u.id = up.user_id JOIN policies AS p ON up.policy_id = p.id';

  constructor() {
    this.#db = Database.connect();
  }

  async getUsers(pagination?: PaginationOptions): Promise<User[]> {
    let result;

    if (pagination) {
      const offset = Pagination.calculateOffset(pagination);

      result = await this.#db.query(
        this.#default_query + ' LIMIT $1 OFFSET $2',
        [pagination.limit, offset]
      );
    } else {
      result = await this.#db.query(this.#default_query);
    }

    const user_objects = new Map<string, UserObject>();

    for (let idx = 0; idx < result.rows.length; idx++) {
      const row = result.rows[idx];

      if (user_objects.has(row.id)) {
        const existent_user = user_objects.get(row.id);
        existent_user!.policies.push(row.slug);
        user_objects.set(row.id, existent_user!);
        continue;
      }

      user_objects.set(row.id, {
        id: row.id,
        email: row.email,
        password: row.password,
        access_plan_id: row.access_plan_id,
        policies: [row.slug]
      });
    }

    const users = [];

    for (const user_obj of user_objects.values()) {
      users.push(new User(user_obj));
    }

    return users;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.#db.query(this.#default_query + ' WHERE id = $1', [id]);

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
      let in_condition = '';

      for (let idx = 1; idx <= user_obj.policies.length; idx++) {
        if (idx === 1) {
          in_condition += `($${idx}`;
          continue;
        }

        if (idx === user_obj.policies.length) {
          in_condition += `, $${idx})`;
          continue;
        }

        in_condition += `, $${idx}`;
      }

      const policy_result = await this.#db.query(
        `SELECT id FROM policies WHERE slug IN ${in_condition}`,
        user_obj.policies
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
        [user_obj.id].concat(policy_ids)
      );
    }
  }

  updateUser(user: User): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
