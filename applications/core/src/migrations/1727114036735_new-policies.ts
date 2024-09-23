import { randomUUID } from 'crypto';
import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import { Policies } from '../modules/_shared/Principal';
import DbUtils from '../modules/_shared/utils/DbUtils';

export const shorthands: ColumnDefinitions | undefined = undefined;

const policies = [
  Policies.CREATE_SUBSCRIBER,
  Policies.GET_SUBSCRIBER,
  Policies.UPDATE_SUBSCRIBER,
  Policies.CREATE_SUBSCRIPTION,
  Policies.UPDATE_SUBSCRIPTION,
  Policies.LIST_SUBSCRIPTIONS,
  Policies.CREATE_SUBSCRIPTION_PLAN,
  Policies.LIST_SUBSCRIPTION_PLANS,
];

export async function up(pgm: MigrationBuilder): Promise<void> {
  const promises = [];

  for (let idx = 0; idx < policies.length; idx++) {
    promises.push(
      pgm.db.query(
        'INSERT INTO policies (id, slug, description) VALUES ($1, $2, $3)',
        [randomUUID(), policies[idx], policies[idx]]
      )
    );
  }

  await Promise.all(promises);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.db.query(
    `DELETE FROM policies WHERE slug IN ${DbUtils.values(policies)}`,
    policies,
  );
}
