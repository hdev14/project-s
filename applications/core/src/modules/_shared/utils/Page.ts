import Aggregate, { AggregateProps, RequiredProps } from "@shared/ddd/Aggregate";
import { PageResult } from "./Pagination";

export type PaginatedResult<P extends AggregateProps> = {
  result: Array<RequiredProps<P>>;
  page_result?: PageResult;
}

export default class Page<P extends AggregateProps> {
  readonly result: Array<Aggregate<P>>;
  readonly page_result?: PageResult;

  constructor(result: Array<Aggregate<P>>, page_result?: PageResult) {
    this.result = result;
    this.page_result = page_result;
  }

  toRaw(): PaginatedResult<P> {
    const result = [];

    for (let idx = 0; idx < this.result.length; idx++) {
      result.push(this.result[idx].toObject());
    }

    return {
      result,
      page_result: this.page_result,
    }
  }
}
