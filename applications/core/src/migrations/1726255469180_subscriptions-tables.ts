import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('subscriptions', 'amount');

  pgm.createType('recurrence_types', ['monthly', 'annually']);

  pgm.createTable('subscription_plans', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    amount: { type: 'float', notNull: true },
    recurrence_type: { type: 'recurrence_types', notNull: true },
    term_url: { type: 'text', notNull: false },
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

  pgm.createType('subscription_status', [
    'pending',
    'active',
    'paused',
    'canceled',
    'finished'
  ]);

  pgm.addColumns('subscriptions', {
    subscription_plan_id: { type: 'uuid', notNull: true, references: 'subscription_plans' },
    tenant_id: { type: 'uuid', notNull: true, references: 'users' },
    status: { type: 'subscription_status', notNull: true },
  });

  pgm.alterColumn('subscriptions', 'started_at', { notNull: false });

  pgm.createTable('subscription_plan_items', {
    subscription_plan_id: { type: 'uuid', notNull: true, references: 'subscription_plans' },
    item_id: { type: 'uuid', notNull: true, references: 'catalog_items' },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('subscription_plan_items');
  pgm.alterColumn('subscriptions', 'started_at', { notNull: true });
  pgm.dropColumns('subscriptions', ['subscription_plan_id', 'tenant_id', 'status']);
  pgm.dropType('subscription_status');
  pgm.dropTable('subscription_plans');
  pgm.dropType('recurrence_types');
  pgm.addColumn('subscriptions', {
    amount: { type: 'float', notNull: true },
  });
}
