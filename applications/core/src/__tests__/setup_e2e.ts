/* eslint-disable @typescript-eslint/no-explicit-any */
import Database from '@shared/Database';
import Server from 'src/Server';
import supertest from 'supertest';

beforeAll(async () => {
  try {
    const server = new Server();
    globalThis.request = supertest(server.application);
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