import CommissionRepository from "@company/app/CommissionRepository";
import Commission from "@company/domain/Commission";
import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class DbCommissionRepository extends DefaultRepository implements CommissionRepository {
  async getCommissionByCatalogItemId(id: string): Promise<Commission | null> {
    const { rows } = await this.db.query('SELECT * FROM commissions WHERE catalog_item_id = $1', [id]);

    if (rows.length === 0) {
      return null;
    }

    return Commission.fromObject({
      id: rows[0].id,
      catalog_item_id: rows[0].catalog_item_id,
      tax: parseFloat(rows[0].tax),
      tax_type: rows[0].tax_type,
      tenant_id: rows[0].tenant_id,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
    });
  }

  async createCommission(commission: Commission): Promise<void> {
    const commission_obj = commission.toObject();
    const values = Object.values(commission_obj);
    await this.db.query(
      `INSERT INTO commissions ${DbUtils.columns(commission_obj)} VALUES ${DbUtils.values(values)}`,
      values
    );
  }

  async updateCommission(commission: Commission): Promise<void> {
    const commission_obj = Object.assign({}, commission.toObject(), { created_at: undefined });

    await this.db.query(
      `UPDATE commissions SET ${DbUtils.setColumns(commission_obj)} WHERE id = $1`,
      DbUtils.sanitizeValues(Object.values(commission_obj))
    );
  }

  async getCommissionById(id: string): Promise<Commission | null> {
    const { rows } = await this.db.query('SELECT * FROM commissions WHERE id = $1', [id]);

    if (rows.length === 0) {
      return null;
    }

    return Commission.fromObject({
      id: rows[0].id,
      catalog_item_id: rows[0].catalog_item_id,
      tax: parseFloat(rows[0].tax),
      tax_type: rows[0].tax_type,
      tenant_id: rows[0].tenant_id,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
    });
  }
}
