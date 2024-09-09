import { randomUUID } from 'crypto';
import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import { Policies } from '../modules/_shared/Principal';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  const secret_policies = [
    Policies.CHANGE_ACCESS_PLAN,
    Policies.CREATE_ACCESS_PLAN,
    Policies.UPDATE_ACCESS_PLAN,
  ];
  const policies = [
    Policies.CREATE_TENANT_USER,
    Policies.LIST_USERS,
    Policies.UPDATE_USER,
    Policies.UPDATE_USER_POLICIES,
    Policies.LIST_POLICIES,
    Policies.UPDATE_CATALOG_ITEM,
    Policies.CREATE_CATALOG_ITEM,
    Policies.LIST_CATALOG_ITEMS,
  ];

  const promises = [];

  for (let idx = 0; idx < policies.length; idx++) {
    promises.push(
      pgm.db.query(
        'INSERT INTO policies (id, slug, description) VALUES($1, $2, $3)',
        [randomUUID(), policies[idx], policies[idx]]
      )
    );
  }

  for (let idx = 0; idx < secret_policies.length; idx++) {
    promises.push(
      pgm.db.query(
        'INSERT INTO policies (id, slug, description, is_secret) VALUES($1, $2, $3, $4)',
        [randomUUID(), secret_policies[idx], secret_policies[idx], true]
      )
    );
  }

  await Promise.all(promises);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.db.query('DELETE FROM policies');
}
