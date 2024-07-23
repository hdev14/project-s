import Commission from "@company/domain/Commission";

export default interface CommissionRepository {
  createCommission(commission: Commission): Promise<void>;
  updateCommission(commission: Commission): Promise<void>;
  getCommissionById(id: string): Promise<Commission | null>;
  getCommissionByCatalogItemId(id: string): Promise<Commission | null>;
}