import type * as Hapi from "@hapi/hapi";
import { authenticateClient, advancedRecordSearch } from "opencrvs-api";
import {
  registrySyncSearchBuilder,
  searchRequestToAdvancedSearchParameters,
} from "dci-opencrvs-bridge";
import type { operations, components } from "../registry-core-api";

async function search(
  token: string,
  request: components["schemas"]["SearchRequest"]
) {
  const searchRequests = request.search_request;
  const searchResults = await Promise.all(
    searchRequests.map(async (searchRequest) => {
      const response = await advancedRecordSearch(
        token,
        searchRequestToAdvancedSearchParameters(searchRequest)
      );

      return {
        response,
        responseFinishedTimestamp: new Date(),
        originalRequest: searchRequest,
      };
    })
  );

  return searchResults;
}

export async function syncSearchHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload =
    request.payload as operations["post_reg_sync_search"]["requestBody"]["content"]["application/json"];

  const token = await authenticateClient();
  const result = await search(token, payload.message);
  return registrySyncSearchBuilder(result, payload);
}
