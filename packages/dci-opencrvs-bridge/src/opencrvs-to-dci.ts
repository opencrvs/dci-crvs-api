import type {
  DeathEventSearchSet,
  MarriageEventSearchSet,
  BirthEventSearchSet,
  EventSearchResultSet,
} from "opencrvs-api";
import type { operations, components } from "dci-api";
import type { SearchResponseWithMetadata } from "./types";
import { ParseError } from "./error";

function name({
  firstNames,
  familyName,
}: {
  firstNames: string;
  familyName: string;
}) {
  return {
    given_name: firstNames.split(" ")[0],
    middle_name: firstNames.split(" ")[1],
    family_name: familyName,
  };
}

function birthCivilRegPerson(
  event: BirthEventSearchSet
): components["schemas"]["civilReg_PersonRecord"] {
  const isMotherDefined = event.mothersFirstName !== undefined;
  const isFatherDefined = event.fathersFirstName !== undefined;
  const isInformantRelationshipUniqueAndDefined =
    event.registration?.contactRelationship !== "FATHER" &&
    event.registration?.contactRelationship !== "MOTHER";
  // &&  composition.informantFirstNames !== undefined; informant names?

  return {
    sub: event.id,
    birthdate: event.dateOfBirth,
    ...name({
      firstNames: event.childName?.[0]?.firstNames ?? "", // TODO: Improve the GraphQL types to assert that these values exist
      familyName: event.childName?.[0]?.familyName ?? "", // TODO: Improve the GraphQL types to assert that these values exist
    }),
    gender: event.childGender ?? "unknown", // TODO: Improve the GraphQL types to assert that these values exist
    related_persons: [
      ...(isMotherDefined
        ? [
            {
              relationship: "mother",
              name: `${event.mothersFirstName} ${event.mothersLastName}`,
              sub: event.motherIdentifier ?? undefined,
            },
          ]
        : []),
      ...(isFatherDefined
        ? [
            {
              relationship: "father",
              name: `${event.fathersFirstName} ${event.fathersLastName}`,
              sub: event.fatherIdentifier ?? undefined,
            },
          ]
        : []),
      ...(isInformantRelationshipUniqueAndDefined
        ? [
            {
              relationship:
                event.registration?.contactRelationship ?? undefined, // TODO: How to map into a DCI relationship?
              name: ``, // TODO: How to get informant name?
              sub: ``, // TODO: How to get informant id?
            },
          ]
        : []),
    ],
  };
}

function deathCivilRegPerson(
  event: DeathEventSearchSet
): components["schemas"]["civilReg_PersonRecord"] {
  const isInformantRelationshipUniqueAndDefined =
    event.registration?.contactRelationship !== "FATHER" &&
    event.registration?.contactRelationship !== "MOTHER";
  // &&  composition.informantFirstNames !== undefined; informant names?

  return {
    sub: event.id,
    deathdate: event.dateOfDeath,
    ...name({
      firstNames: event.deceasedName?.[0]?.firstNames ?? "", // TODO: Improve the GraphQL types to assert that these values exist
      familyName: event.deceasedName?.[0]?.familyName ?? "", // TODO: Improve the GraphQL types to assert that these values exist
    }),
    gender: event.deceasedGender ?? "unknown", // TODO: Improve the GraphQL types to assert that these values exist
    related_persons: [
      ...(isInformantRelationshipUniqueAndDefined
        ? [
            {
              relationship:
                event.registration?.contactRelationship ?? undefined, // TODO: How to map into a DCI relationship?
              name: ``, // TODO: How to get informant name?
              sub: ``, // TODO: How to get informant id?
            },
          ]
        : []),
    ],
  };
}

function marriageCivilRegPerson(
  event: MarriageEventSearchSet
): components["schemas"]["civilReg_PersonRecord"] {
  return {
    // TODO: return a correct payload
    sub: event.id,
  };
}

function eventType(event: string) {
  switch (event) {
    case "Birth":
      return "1" satisfies components["schemas"]["dci_VitalEvents"];
    case "Death":
      return "2" satisfies components["schemas"]["dci_VitalEvents"];
    case "Marriage":
      return "4" satisfies components["schemas"]["dci_VitalEvents"];
    default:
      throw new ParseError("Unimplemented event type");
  }
}

function isBirthEventSearchSet(
  eventSearchSet:
    | BirthEventSearchSet
    | DeathEventSearchSet
    | MarriageEventSearchSet
): eventSearchSet is BirthEventSearchSet {
  return eventSearchSet.__typename === "BirthEventSearchSet";
}

function isMarriageEventSearchSet(
  eventSearchSet:
    | BirthEventSearchSet
    | DeathEventSearchSet
    | MarriageEventSearchSet
): eventSearchSet is MarriageEventSearchSet {
  return eventSearchSet.__typename === "MarriageEventSearchSet";
}

export function searchResponseBuilder(
  event: BirthEventSearchSet | DeathEventSearchSet | MarriageEventSearchSet,
  {
    referenceId,
    timestamp,
  }: {
    referenceId: string;
    timestamp: components["schemas"]["DateTime"];
  }
): components["schemas"]["SearchResponse"]["search_response"][number] {
  if (event.type === undefined || event.type === null) {
    // TODO: The GraphQL event type should always be defined
    throw new Error("Event type is not defined");
  }

  return {
    reference_id: referenceId,
    timestamp,
    status: "succ",
    event_type: eventType(event.type),
    registry_type: "civil",
    registry_data: {
      record_type: "person",
      record: isBirthEventSearchSet(event)
        ? birthCivilRegPerson(event)
        : isMarriageEventSearchSet(event)
        ? marriageCivilRegPerson(event)
        : deathCivilRegPerson(event),
    },
  };
}

export function registrySyncSearchBuilder(
  responses: Array<SearchResponseWithMetadata<EventSearchResultSet>>,
  request: operations["post_reg_sync_search"]["requestBody"]["content"]["application/json"]
) {
  const totalCount = responses
    .map(({ response }) => response.totalItems ?? 0)
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
          response.results?.map((search) =>
            // TODO: Improve the GraphQL types to assert the results do exist, but they can be an empty array
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            searchResponseBuilder(search!, {
              referenceId: originalRequest.reference_id,
              timestamp: responseFinishedTimestamp.toISOString(),
            })
          ) ?? []
      ),
    },
  } satisfies operations["post_reg_sync_search"]["responses"]["default"]["content"]["application/json"];
}
