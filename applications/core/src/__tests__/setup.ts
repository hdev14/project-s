import Database from '@shared/Database';

beforeAll(async () => {
  try {
    globalThis.db = Database.connect();
  } catch (e: any) {
    console.error(e.stack);
  }
});

afterAll(async () => {
  try {
    await globalThis.db.end();
  } catch (e: any) {
    console.error(e.stack);
  }
});