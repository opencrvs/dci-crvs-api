import type { SearchResponse } from "opencrvs-api";
import type { components } from "dci-api";

export interface SearchResponseWithMetadata<T> {
  response: SearchResponse<T>;
  responseFinishedTimestamp: Date;
  originalRequest: components["schemas"]["SearchRequest"]["search_request"][number];
}
