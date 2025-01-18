import Aggregate, { AggregateProps, RequiredProps } from "@shared/ddd/Aggregate";
import { PageInfo } from "./Pagination";

export type PaginatedResult<P extends AggregateProps> = {
  result: Array<RequiredProps<P>>;
  page_info?: PageInfo;
}

export default class Page<P extends AggregateProps> {
  readonly result: Array<Aggregate<P>>;
  readonly page_info?: PageInfo;

  constructor(result: Array<Aggregate<P>>, page_info?: PageInfo) {
    this.result = result;
    this.page_info = page_info;
  }

  toRaw(): PaginatedResult<P> {
    const result = [];

    for (let idx = 0; idx < this.result.length; idx++) {
      result.push(this.result[idx].toObject());
    }

    return {
      result,
      page_info: this.page_info,
    }
  }
}
