import type { SearchResponse, BirthComposition } from "opencrvs-api";
import type { operations, components } from "dci-api";

function name({
  childFirstNames,
  childFamilyName,
}: {
  childFirstNames: string;
  childFamilyName: string;
}) {
  return {
    given_name: childFirstNames.split(" ")[0],
    middle_name: childFirstNames.split(" ")[1],
    family_name: childFamilyName,
  };
}

function civilRegPerson(
  birthComposition: BirthComposition
): components["schemas"]["civilReg_PersonRecord"] {
  return {
    sub: birthComposition.compositionId,
    birthdate: birthComposition.childDoB,
    ...name({
      childFirstNames: birthComposition.childFirstNames,
      childFamilyName: birthComposition.childFamilyName,
    }),
  };
}

function searchResponseBuilder(
  response: SearchResponse<BirthComposition>,
  {
    referenceId,
    timestamp,
  }: { referenceId: string; timestamp: components["schemas"]["DateTime"] }
): components["schemas"]["SearchResponse"]["search_response"][number] {
  return {
    reference_id: referenceId,
    timestamp,
    status: "succ",
    registry_type: "civil",
    event_type: "1",
    registry_data: {
      record_type: "person",
      record: civilRegPerson(response.hits.hits[0]._source),
    },
  };
}

export function registrySyncSearchBuilder(
  response: SearchResponse<BirthComposition>,
  request: operations["post_reg_sync_search"]["requestBody"]["content"]["application/json"],
  iso8601Timestamp: components["schemas"]["DateTime"]
) {
  return {
    signature: "<<todo>>",
    header: {
      version: "1.0.0",
      message_id: request.header.message_id,
      message_ts: new Date().toISOString(),
      action: "on-search",
      status: "succ",
      total_count: response.hits.total.value,
      sender_id: request.header.sender_id,
      receiver_id: request.header.receiver_id,
    },
    message: {
      transaction_id: request.message.transaction_id,
      search_response: [
        searchResponseBuilder(response, {
          referenceId: request.message.search_request[0].reference_id,
          timestamp: iso8601Timestamp,
        }),
      ],
    },
  } satisfies operations["post_reg_sync_search"]["responses"]["default"]["content"]["application/json"];
}
