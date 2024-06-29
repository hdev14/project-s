import PolicyRepository, { PolicyFilter } from "@auth/app/PolicyRepository";
import Policy from "@auth/domain/Policy";
import Database from "@shared/infra/Database";
import DbUtils from "@shared/utils/DbUtils";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';

@injectable()
export default class DbPolicyRepository implements PolicyRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getPolicies(filter?: PolicyFilter): Promise<Policy[]> {
    let query = 'SELECT * FROM policies';
    let values: unknown[] = [];

    if (filter && filter.slugs) {
      values = filter.slugs;
      const in_operator = DbUtils.inOperator(filter.slugs);
      query += ` WHERE slug ${in_operator}`;
    }

    const result = await this.#db.query(query, values);

    const policies = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      const data = result.rows[idx];
      policies.push(new Policy({
        id: data.id,
        slug: data.slug,
        description: data.description,
      }));
    }

    return policies;
  }

  async getPolicyBySlug(slug: string): Promise<Policy | null> {
    const result = await this.#db.query('SELECT * FROM policies WHERE slug=$1', [slug]);

    const data = result.rows[0];

    if (!data) {
      return null;
    }

    return new Policy({
      id: data.id,
      slug: data.slug,
      description: data.description,
    });
  }

  async createPolicy(policy: Policy): Promise<void> {
    const policy_obj = policy.toObject();
    const values = Object.values(policy_obj);
    const query = `INSERT INTO policies ${DbUtils.columns(policy_obj)} VALUES ${DbUtils.values(values)}`;
    await this.#db.query(query, DbUtils.sanitizeValues(values));
  }

  async deletePolicy(id: string): Promise<void> {
    await this.#db.query('DELETE FROM policies WHERE id=$1', [id]);
  }
}