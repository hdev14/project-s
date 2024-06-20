import AccessPlanRepository from "@auth/app/AccessPlanRepository";
import AccessPlan from "@auth/domain/AccessPlan";
import Database from "@shared/Database";
import { Pool } from "pg";

export default class DbAccessPlanRepository implements AccessPlanRepository {
  #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  async getAccessPlanById(id: string): Promise<AccessPlan | null> {
    const result = await this.#db.query('SELECT * FROM access_plans WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const data = result.rows[0];

    return new AccessPlan({
      id: data.id,
      active: data.active,
      amount: data.amount,
      type: data.type,
      description: data.description,
    });
  }

  async getAccessPlans(): Promise<AccessPlan[]> {
    const result = await this.#db.query('SELECT * FROM access_plans');

    const access_plans = [];

    for (let idx = 0; idx < result.rows.length; idx++) {
      const data = result.rows[idx];
      access_plans.push(new AccessPlan({
        id: data.id,
        active: data.active,
        amount: parseFloat(data.amount),
        type: data.type,
        description: data.description
      }));
    }

    return access_plans;
  }

  async createAccessPlan(access_plan: AccessPlan): Promise<void> {
    const query = 'INSERT INTO access_plans(id, active, amount, type, description) VALUES($1, $2, $3, $4, $5)';
    const data = access_plan.toObject()
    const values = [data.id, data.active, data.amount, data.type, data.description];
    await this.#db.query(query, values);
  }

  async updateAccessPlan(access_plan: AccessPlan): Promise<void> {
    const query = 'UPDATE access_plans SET active=$2, amount=$3, type=$4, description=$5 WHERE id=$1';
    const data = access_plan.toObject()
    const values = [data.id, data.active, data.amount, data.type, data.description];
    await this.#db.query(query, values);
  }
}