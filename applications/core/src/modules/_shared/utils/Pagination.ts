export type PaginationOptions = {
  limit: number;
  page: number;
}

export default class Pagination {
  static calculateOffset(pagination: PaginationOptions) {
    const result = pagination.page - 1;

    return result < 0 ? 0 : result * pagination.limit;
  }
}