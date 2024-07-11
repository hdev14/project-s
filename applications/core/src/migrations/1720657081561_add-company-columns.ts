import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns('users', {
    document: { type: 'varchar(14)', notNull: false },
    name: { type: 'varchar(100)', notNull: false },
    street: { type: 'varchar(100)', notNull: false },
    district: { type: 'varchar(100)', notNull: false },
    state: { type: 'varchar(2)', notNull: false },
    number: { type: 'varchar(5)', notNull: false },
    complement: { type: 'varchar(50)', notNull: false },
    account: { type: 'varchar(10)', notNull: false },
    account_digit: { type: 'varchar(2)', notNull: false },
    agency: { type: 'varchar(6)', notNull: false },
    agency_digit: { type: 'varchar(2)', notNull: false },
    bank_code: { type: 'varchar(4)', notNull: false },
    color: { type: 'varchar(7)', notNull: false },
    logo_url: { type: 'text', notNull: false },
    is_admin: { type: 'boolean', notNull: false, default: false }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('users', [
    'document',
    'name',
    'street',
    'district',
    'state',
    'number',
    'complement',
    'account',
    'account_digit',
    'agency',
    'agency_digit',
    'bank_code',
    'color',
    'logo_url',
    'is_admin',
  ]);
}
