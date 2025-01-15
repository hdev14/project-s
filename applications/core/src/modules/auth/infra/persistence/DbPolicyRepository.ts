import PolicyRepository, { PolicyFilter } from "@auth/app/PolicyRepository";
import Policy, { PolicyProps } from "@auth/domain/Policy";
import DefaultRepository from "@shared/DefaultRepository";
import Collection from "@shared/utils/Collection";
import DbUtils from "@shared/utils/DbUtils";
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class DbPolicyRepository extends DefaultRepository implements PolicyRepository {
  async getPolicies(filter?: PolicyFilter): Promise<Collection<PolicyProps>> {
    let query = 'SELECT * FROM policies';
    let values: unknown[] = [];

    if (filter && filter.slugs) {
      values = filter.slugs;
      const in_operator = DbUtils.inOperator(filter.slugs);
      query += ` WHERE slug ${in_operator}`;
    }

    const result = await this.db.query(query, values);

    const policies = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      const row = result.rows[idx];
      policies.push(Policy.fromObject({
        id: row.id,
        slug: row.slug,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    }

    return new Collection(policies);
  }

  async getPolicyBySlug(slug: string): Promise<Policy | null> {
    const result = await this.db.query('SELECT * FROM policies WHERE slug=$1', [slug]);

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return Policy.fromObject({
      id: row.id,
      slug: row.slug,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
