import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('subscription_plans', {
    next_billing_date: {
      type: 'timestamp',
      notNull: false,
    }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('subscription_plans', 'next_billing_date');
}
