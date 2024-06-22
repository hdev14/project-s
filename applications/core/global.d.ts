/* eslint-disable no-var */
declare module globalThis {
  declare var request: import('supertest/lib/agent') <import('supertest').Test>;
  declare var db: import('pg').Pool;
}