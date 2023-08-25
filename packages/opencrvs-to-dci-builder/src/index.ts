import { SearchResponse, BirthCompositionBody } from "opencrvs-api";
import { operations } from "./registry-core-api";

export function registrySyncSearchBuilder(
  response: SearchResponse<BirthCompositionBody>,
  request: operations["post_reg_sync_search"]["requestBody"]["content"]["application/json"]
) {
  return {
    signature: "<<todo>>",
    header: {
      version: "1.0.0",
      message_id: "<<todo>>",
      message_ts: new Date().toISOString(),
      action: "on-search",
      status: "succ",
      total_count: 1,
      sender_id: "<<todo>>",
      receiver_id: "<<todo>>",
    },
    message: {
      transaction_id: request.message.transaction_id,
      search_response: [
        {
          reference_id: request.message.search_request[0].reference_id,
          timestamp:
            "<<todo, this probably must be the timestamp of when the search completed, instead of current time>>",
          status: "succ",
          registry_type: "civil",
          event_type: "1",
          registry_data: {
            record_type: "person",
            record: {
              given_name: response.hits.hits[0]._source.childFirstNames,
              family_name: response.hits.hits[0]._source.childFamilyName,
            },
          },
        },
      ],
    },
  } satisfies operations["post_reg_sync_search"]["responses"]["default"]["content"]["application/json"];
}

export type * from "./registry-core-api";
