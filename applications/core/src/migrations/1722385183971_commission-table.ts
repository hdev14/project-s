import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('tax_types', ['percentage', 'raw']);

  pgm.createTable('commissions', {
    id: { type: 'uuid', primaryKey: true, notNull: true },
    catalog_item_id: { type: 'uuid', notNull: true, references: 'catalog_items' },
    tax: { type: 'float', notNull: true },
    tax_type: { type: 'tax_types', notNull: true },
    tenant_id: { type: 'uuid', notNull: true, references: 'users' },
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
  pgm.dropTable('commissions');
  pgm.dropType('tax_types');
}
