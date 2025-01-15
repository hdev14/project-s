import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('payment_status', ['pending', 'paid', 'rejected', 'canceled']);

  pgm.createTable('payments', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    amount: { type: 'float', notNull: true },
    tax: { type: 'float', notNull: false, default: 0 },
    status: { type: 'payment_status', notNull: true },
    tenant_id: { type: 'uuid', notNull: true, references: 'users' },
    subscription_id: { type: 'uuid', notNull: true, references: 'subscriptions' },
    refusal_reason: { type: 'varchar(255)', notNull: false },
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

  pgm.createTable('payment_logs', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    payment_id: { type: 'uuid', notNull: true, references: 'payments' },
    external_id: { type: 'varchar(255)', notNull: true },
    payload: { type: 'jsonb', notNull: true },
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
  pgm.dropTable('payment_logs');
  pgm.dropTable('payments');
  pgm.dropType('payment_status');
}
