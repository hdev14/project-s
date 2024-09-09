import Database from "@shared/Database";

beforeAll(async () => {
  try {
    globalThis.db = Database.connect();
  } catch (e: any) {
    console.error(e.stack);
  }
});

afterAll(async () => {
  try {
    if (globalThis.db.end) {
      await globalThis.db.end();
    }
  } catch (e: any) {
    console.error(e.stack);
  }
});
