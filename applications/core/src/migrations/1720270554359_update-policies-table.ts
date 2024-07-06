import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('policies', {
    is_secret: { type: 'boolean', notNull: false, default: false }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('policies', 'is_secret');
}
