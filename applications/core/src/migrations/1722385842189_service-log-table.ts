import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('service_logs', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    commission_amount: { type: 'float', notNull: true },
    employee_id: { type: 'uuid', notNull: true, references: 'users' },
    service_id: { type: 'uuid', notNull: true, references: 'catalog_items' },
    customer_id: { type: 'uuid', notNull: true, references: 'users' },
    tenant_id: { type: 'uuid', notNull: true, references: 'users' },
    paid_amount: { type: 'float', notNull: true },
    registed_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
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
  pgm.dropTable('service_logs');
}
