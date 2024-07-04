import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('catalog_items', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: true },
    attributes: { type: 'jsonb', notNull: true, default: '[]' },
    is_service: { type: 'boolean', notNull: true, default: false },
    picture_url: { type: 'text', notNull: false },
    tenant_id: { type: 'uuid', notNull: true, references: 'users' },
    deleted_at: {
      type: 'timestamp',
      notNull: false,
    },
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
  pgm.dropTable('catalog_items');
}
