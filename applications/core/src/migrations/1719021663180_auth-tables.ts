import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('access_plan_type', ['monthly', 'annually']);

  pgm.createTable('access_plans', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    amount: { type: 'float', notNull: true },
    type: { type: 'access_plan_type', notNull: true },
    description: { type: 'text', notNull: false },
    active: { type: 'boolean', notNull: true, default: true },
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

  pgm.createTable('users', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    email: { type: 'varchar(255)', notNull: true },
    password: { type: 'varchar(1000)', notNull: true },
    access_plan_id: { type: 'uuid', references: 'access_plans', notNull: false },
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

  pgm.createTable('policies', {
    id: { type: 'uuid', notNull: true, primaryKey: true },
    slug: { type: 'varchar(255)', notNull: true, unique: true },
    description: { type: 'text', notNull: false },
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

  pgm.createTable('user_policies', {
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    policy_id: { type: 'uuid', notNull: true, references: 'policies' },
  });

  pgm.addConstraint('user_policies', 'user_policy_primary_key', {
    primaryKey: ['user_id', 'policy_id'],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint('user_policies', 'user_policy_primary_key');
  pgm.dropTable('user_policies');
  pgm.dropTable('policies');
  pgm.dropTable('users');
  pgm.dropTable('access_plans');
  pgm.dropType('access_plan_type');
}
