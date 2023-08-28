import type * as Hapi from "@hapi/hapi";
import { authenticateClient, advancedRecordSearch } from "opencrvs-api";
import {
  registrySyncSearchBuilder,
  searchRequestToAdvancedSearchParameters,
} from "dci-opencrvs-bridge";
import type { operations } from "../registry-core-api";

export async function syncSearchHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload =
    request.payload as operations["post_reg_sync_search"]["requestBody"]["content"]["application/json"];

  const token = await authenticateClient();
  const searchResult = await advancedRecordSearch(
    token,
    searchRequestToAdvancedSearchParameters(payload.message)
  );
  const resultTimestamp = new Date().toISOString();

  const dciStandardizedResult = registrySyncSearchBuilder(
    searchResult.body,
    payload,
    resultTimestamp
  );

  console.log(JSON.stringify(dciStandardizedResult, null, 4));

  return dciStandardizedResult;
}
