import CommissionRepository from "@company/app/CommissionRepository";
import Commission from "@company/domain/Commission";

export default class DbCommissionRepository implements CommissionRepository {
  createCommission(commission: Commission): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateCommission(commission: Commission): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getCommissionById(id: string): Promise<Commission | null> {
    throw new Error("Method not implemented.");
  }
}