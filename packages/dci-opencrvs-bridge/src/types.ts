import type { components } from "dci-api";

export interface SearchResponseWithMetadata<T> {
  response: T;
  responseFinishedTimestamp: Date;
  originalRequest: components["schemas"]["SearchRequest"]["search_request"][number];
}
