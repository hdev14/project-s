import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('users', {
    tenant_id: { type: 'uuid', notNull: false },
  });

  pgm.addConstraint('users', 'users_tenant_fk', {
    foreignKeys: { columns: ['tenant_id'], references: 'users' },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint('users', 'users_tenant_fk');
  pgm.dropColumn('users', 'tenant_id');
}
