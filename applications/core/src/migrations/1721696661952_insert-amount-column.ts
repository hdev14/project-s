import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('catalog_items', {
    amount: { type: 'float', notNull: true, default: 0 }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('catalog_items', 'amount');
}
