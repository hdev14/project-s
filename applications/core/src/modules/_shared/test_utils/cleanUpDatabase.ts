export default async function cleanUpDatabase() {
  await globalThis.db.query('DELETE FROM user_policies');
  await globalThis.db.query('DELETE FROM policies');
  await globalThis.db.query('DELETE FROM verification_codes');
  await globalThis.db.query('DELETE FROM commissions');
  await globalThis.db.query('DELETE FROM service_logs');
  await globalThis.db.query('DELETE FROM subscription_plan_items');
  await globalThis.db.query('DELETE FROM subscriptions');
  await globalThis.db.query('DELETE FROM subscription_plans');
  await globalThis.db.query('DELETE FROM catalog_items');
  await globalThis.db.query('DELETE FROM users');
  await globalThis.db.query('DELETE FROM access_plans');
}
