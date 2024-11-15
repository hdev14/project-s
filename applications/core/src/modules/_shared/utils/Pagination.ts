export type PageOptions = {
  limit: number;
  page: number;
}

export type PageResult = {
  next_page: number;
  total_of_pages: number;
};

export type PaginatedResult<T> = {
  results: Array<T>;
  page_result?: PageResult;
}

export default class Pagination {
  static calculateOffset(page_options: PageOptions) {
    const result = page_options.page - 1;

    return result < 0 ? 0 : result * page_options.limit;
  }

  static calculatePageResult(total: number, pagination: PageOptions): PageResult {
    if (total === 0) {
      return { total_of_pages: 0, next_page: 0 }
    }

    const total_of_pages = Math.ceil(total / pagination.limit);
    const next_page = pagination.page < total_of_pages ? pagination.page + 1 : -1;

    return { total_of_pages, next_page };
  }
}
