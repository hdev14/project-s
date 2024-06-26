/* eslint-disable no-var */
declare module globalThis {
  declare var db: import('pg').Pool;
}