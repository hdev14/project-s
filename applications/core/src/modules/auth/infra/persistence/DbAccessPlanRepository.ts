import AccessPlanRepository from "@auth/app/AccessPlanRepository";
import AccessPlan, { AccessPlanProps } from "@auth/domain/AccessPlan";
import DefaultRepository from "@shared/DefaultRepository";
import DbUtils from "@shared/utils/DbUtils";
import { injectable } from "inversify";
import 'reflect-metadata';

@injectable()
export default class DbAccessPlanRepository extends DefaultRepository implements AccessPlanRepository {
  async getAccessPlanById(id: string): Promise<AccessPlan | null> {
    const result = await this.db.query('SELECT * FROM access_plans WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return AccessPlan.fromObject({
      id: row.id,
      active: row.active,
      amount: parseFloat(row.amount),
      type: row.type,
      description: row.description,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }

  async getAccessPlans(): Promise<Array<AccessPlanProps>> {
    const result = await this.db.query('SELECT * FROM access_plans');

    const access_plans = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      const row = result.rows[idx];
      access_plans.push({
        id: row.id,
        active: row.active,
        amount: parseFloat(row.amount),
        type: row.type,
        description: row.description,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      });
    }

    return access_plans;
  }

  async createAccessPlan(access_plan: AccessPlan): Promise<void> {
    const data = access_plan.toObject()
    const values = Object.values(data);

    const query = `INSERT INTO access_plans ${DbUtils.columns(data)} VALUES ${DbUtils.values(values)}`;

    await this.db.query(query, DbUtils.sanitizeValues(values));
  }

  async updateAccessPlan(access_plan: AccessPlan): Promise<void> {
    const query = 'UPDATE access_plans SET active=$2,amount=$3,type=$4,description=$5,updated_at=$6 WHERE id=$1';
    const data = access_plan.toObject()
    const values = [
      data.id,
      data.active,
      data.amount,
      data.type,
      data.description,
      data.updated_at,
    ];
    await this.db.query(query, values);
  }
}
