import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('verification_codes', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    code: { type: 'varchar(4)', notNull: true, unique: true },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    expired_at: { type: 'timestamp', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('verification_codes');
}
