import type { components } from "dci-api";
import type { Registration } from "opencrvs-api";

export interface SearchResponseWithMetadata {
  registrations: Registration[];
  responseFinishedTimestamp: Date;
  originalRequest: components["schemas"]["SearchRequest"]["search_request"][number];
}
