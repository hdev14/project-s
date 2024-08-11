
declare global {
  namespace jest {
    interface AsymmetricMatchers {
      toEqualInDatabase(table: string, id: string): Promise<void>;
      toExistsInTable(table: string): Promise<void>;
      toHasPoliciesInDatabase(): Promise<void>;
      toBeNullInDatabase(table: string, id: string): Promise<void>;
    }

    interface Matchers<R> {
      toEqualInDatabase(table: string, id: string): Promise<R>;
      toExistsInTable(table: string): Promise<R>;
      toHasPoliciesInDatabase(): Promise<R>;
      toBeNullInDatabase(table: string, id: string): Promise<R>;
    }
  }
}

export { };
