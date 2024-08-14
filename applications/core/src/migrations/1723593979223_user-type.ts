import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('users', 'is_admin');
  pgm.createType('user_type', ['admin', 'company', 'customer', 'employee']);
  pgm.addColumn('users', {
    type: { type: 'user_type', notNull: true, default: 'admin' }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('users', 'type');
  pgm.dropType('user_type');
  pgm.addColumn('users', {
    is_admin: { type: 'boolean', notNull: false, default: false }
  });
}
