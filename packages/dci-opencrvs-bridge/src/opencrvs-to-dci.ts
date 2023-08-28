import {
  type SearchResponse,
  type BirthComposition,
  Event,
} from "opencrvs-api";
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

function eventType(event: Event) {
  switch (event) {
    case Event.BIRTH:
      return "1" satisfies components["schemas"]["dci_VitalEvents"];
    case Event.DEATH:
      return "2" satisfies components["schemas"]["dci_VitalEvents"];
    case Event.MARRIAGE:
      return "4" satisfies components["schemas"]["dci_VitalEvents"];
    default:
      throw new Error("Unimplemented event type");
  }
}

function searchResponseBuilder(
  composition: BirthComposition,
  {
    referenceId,
    timestamp,
  }: {
    referenceId: string;
    timestamp: components["schemas"]["DateTime"];
  }
): components["schemas"]["SearchResponse"]["search_response"][number] {
  return {
    reference_id: referenceId,
    timestamp,
    status: "succ",
    event_type: eventType(composition.event),
    registry_type: "civil",
    registry_data: {
      record_type: "person",
      record: civilRegPerson(composition),
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
      search_response: response.hits.hits.map(({ _source }) =>
        searchResponseBuilder(_source, {
          referenceId: request.message.search_request[0].reference_id,
          timestamp: iso8601Timestamp,
        })
      ),
    },
  } satisfies operations["post_reg_sync_search"]["responses"]["default"]["content"]["application/json"];
}
