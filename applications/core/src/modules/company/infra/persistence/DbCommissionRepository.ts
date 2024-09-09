import CommissionRepository from "@company/app/CommissionRepository";
import Commission from "@company/domain/Commission";
import Database from "@shared/Database";
import DbUtils from "@shared/utils/DbUtils";
import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';

@injectable()
export default class DbCommissionRepository implements CommissionRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getCommissionByCatalogItemId(id: string): Promise<Commission | null> {
    const { rows } = await this.#db.query('SELECT * FROM commissions WHERE catalog_item_id = $1', [id]);

    if (rows.length === 0) {
      return null;
    }

    return new Commission({
      id: rows[0].id,
      catalog_item_id: rows[0].catalog_item_id,
      tax: rows[0].tax,
      tax_type: rows[0].tax_type,
      tenant_id: rows[0].tenant_id,
    });
  }

  async createCommission(commission: Commission): Promise<void> {
    const commission_obj = commission.toObject();
    const values = Object.values(commission_obj);
    await this.#db.query(
      `INSERT INTO commissions ${DbUtils.columns(commission_obj)} VALUES ${DbUtils.values(values)}`,
      values
    );
  }

  async updateCommission(commission: Commission): Promise<void> {
    const commission_obj = commission.toObject();

    await this.#db.query(
      `UPDATE commissions SET ${DbUtils.setColumns(commission_obj)} WHERE id = $1`,
      DbUtils.sanitizeValues(Object.values(commission_obj))
    );
  }

  async getCommissionById(id: string): Promise<Commission | null> {
    const { rows } = await this.#db.query('SELECT * FROM commissions WHERE id = $1', [id]);

    if (rows.length === 0) {
      return null;
    }

    return new Commission({
      id: rows[0].id,
      catalog_item_id: rows[0].catalog_item_id,
      tax: rows[0].tax,
      tax_type: rows[0].tax_type,
      tenant_id: rows[0].tenant_id,
    });
  }
}
