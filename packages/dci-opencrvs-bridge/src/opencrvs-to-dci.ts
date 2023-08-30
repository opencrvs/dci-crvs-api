import {
  type BirthComposition,
  type DeathComposition,
  type MarriageComposition,
  Event,
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
  composition: BirthComposition
): components["schemas"]["civilReg_PersonRecord"] {
  const isMotherDefined = composition.motherFirstNames !== undefined;
  const isFatherDefined = composition.fatherFirstNames !== undefined;
  const isInformantRelationshipUniqueAndDefined =
    composition.contactRelationship !== "FATHER" &&
    composition.contactRelationship !== "MOTHER" &&
    composition.informantFirstNames !== undefined;

  return {
    sub: composition.compositionId,
    birthdate: composition.childDoB,
    ...name({
      firstNames: composition.childFirstNames,
      familyName: composition.childFamilyName,
    }),
    gender: composition.gender,
    related_persons: [
      ...(isMotherDefined
        ? [
            {
              relationship: "mother",
              name: `${composition.motherFirstNames} ${composition.motherFamilyName}`,
              sub: composition.motherIdentifier,
            },
          ]
        : []),
      ...(isFatherDefined
        ? [
            {
              relationship: "father",
              name: `${composition.fatherFirstNames} ${composition.fatherFamilyName}`,
              sub: composition.fatherIdentifier,
            },
          ]
        : []),
      ...(isInformantRelationshipUniqueAndDefined
        ? [
            {
              relationship: composition.contactRelationship, // TODO: How to map into a DCI relationship
              name: `${composition.informantFirstNames} ${composition.informantFamilyName}`,
              sub: composition.informantIdentifier,
            },
          ]
        : []),
    ],
  };
}

function deathCivilRegPerson(
  composition: DeathComposition
): components["schemas"]["civilReg_PersonRecord"] {
  const isInformantRelationshipUniqueAndDefined =
    composition.contactRelationship !== "FATHER" &&
    composition.contactRelationship !== "MOTHER" &&
    composition.informantFirstNames !== undefined;

  return {
    sub: composition.compositionId,
    birthdate: composition.childDoB,
    ...name({
      firstNames: composition.deceasedFirstNames,
      familyName: composition.deceasedFamilyName,
    }),
    gender: composition.gender,
    related_persons: [
      ...(isInformantRelationshipUniqueAndDefined
        ? [
            {
              relationship: composition.contactRelationship, // TODO: How to map into a DCI relationship
              name: `${composition.informantFirstNames} ${composition.informantFamilyName}`,
              sub: composition.informantIdentifier,
            },
          ]
        : []),
    ],
  };
}

function marriageCivilRegPerson(
  composition: MarriageComposition
): components["schemas"]["civilReg_PersonRecord"] {
  return {
    // TODO: return a correct payload
    sub: composition.registrationNumber,
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
      throw new ParseError("Unimplemented event type");
  }
}

function isBirthComposition(
  composition: BirthComposition | DeathComposition | MarriageComposition
): composition is BirthComposition {
  return composition.event === Event.BIRTH;
}

function isMarriageComposition(
  composition: BirthComposition | DeathComposition | MarriageComposition
): composition is MarriageComposition {
  return composition.event === Event.MARRIAGE;
}

function searchResponseBuilder(
  composition: BirthComposition | DeathComposition | MarriageComposition,
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
      record: isBirthComposition(composition)
        ? birthCivilRegPerson(composition)
        : isMarriageComposition(composition)
        ? marriageCivilRegPerson(composition)
        : deathCivilRegPerson(composition),
    },
  };
}

export function registrySyncSearchBuilder(
  responses: Array<
    SearchResponseWithMetadata<BirthComposition | DeathComposition>
  >,
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
