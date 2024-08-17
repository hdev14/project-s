import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addType('payment_types', ['pix', 'credit_card', 'boleto']);

  pgm.addColumns('users', {
    payment_type: { type: 'payment_types', notNull: false, default: 'pix' },
    credit_card_external_id: { type: 'varchar(255)', notNull: false },
    phone_number: { type: 'varchar(20)', notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('users', ['payment_type', 'credit_card_external_id', 'phone_number']);

  pgm.dropType('payment_types');
}
