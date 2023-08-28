import { type BirthComposition, Event } from "opencrvs-api";
import type { operations, components } from "dci-api";
import type { SearchResponseWithMetadata } from "./types";

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
    gender: birthComposition.gender,

    related_persons: [
      ...(birthComposition.motherFirstNames !== undefined
        ? [
            {
              relationship: "mother",
              name: `${birthComposition.motherFirstNames} ${birthComposition.motherFamilyName}`,
              sub: birthComposition.motherIdentifier,
            },
          ]
        : []),
      ...(birthComposition.fatherFirstNames !== undefined
        ? [
            {
              relationship: "father",
              name: `${birthComposition.fatherFirstNames} ${birthComposition.fatherFamilyName}`,
              sub: birthComposition.fatherIdentifier,
            },
          ]
        : []),
      // TODO: informant?
    ],
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
  responses: Array<SearchResponseWithMetadata<BirthComposition>>,
  request: operations["post_reg_sync_search"]["requestBody"]["content"]["application/json"]
) {
  const totalCount = responses
    .map((response) => response.response.hits.total.value)
    .reduce((a, b) => a + b, 0);

  return {
    signature: "<<todo>>",
    header: {
      version: "1.0.0",
      message_id: request.header.message_id,
      message_ts: new Date().toISOString(),
      action: "on-search",
      status: "succ",
      total_count: totalCount,
      sender_id: request.header.sender_id,
      receiver_id: request.header.receiver_id,
    },
    message: {
      transaction_id: request.message.transaction_id,
      search_response: responses.flatMap(
        ({ response, originalRequest, responseFinishedTimestamp }) =>
          response.hits.hits.map(({ _source }) =>
            searchResponseBuilder(_source, {
              referenceId: originalRequest.reference_id,
              timestamp: responseFinishedTimestamp.toISOString(),
            })
          )
      ),
    },
  } satisfies operations["post_reg_sync_search"]["responses"]["default"]["content"]["application/json"];
}
