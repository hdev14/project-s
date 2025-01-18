import { injectable } from "inversify";
import { Pool } from "pg";
import 'reflect-metadata';
import Database from "./Database";
import DbUtils from "./utils/DbUtils";
import Pagination, { PageOptions } from "./utils/Pagination";

type GetRowsPaginatedOptions = {
  main_query: string;
  count_query: string;
  page_options: PageOptions;
  values?: unknown[];
};

@injectable()
export default abstract class DefaultRepository {
  readonly #db: Pool;

  constructor() {
    this.#db = Database.connect();
  }

  protected get db() {
    return this.#db;
  }

  protected async getRowsPaginated(options: GetRowsPaginatedOptions) {
    const values = options.values || [];
    const offset = Pagination.calculateOffset(options.page_options);

    const count_result = await this.#db.query(options.count_query, DbUtils.sanitizeValues(values));
    const sanitized_values = DbUtils.sanitizeValues(values);

    const paginated_query = options.main_query + (
      sanitized_values.length > 0
        ? ` LIMIT $${sanitized_values.length + 1} OFFSET $${sanitized_values.length + 2}`
        : ' LIMIT $1 OFFSET $2'
    );

    const { rows } = await this.#db.query(
      paginated_query,
      sanitized_values.concat([options.page_options.limit, offset])
    );

    const page_info = Pagination.calculatePageResult(count_result.rows[0].total, options.page_options);

    return { rows, page_info };
  }
}
