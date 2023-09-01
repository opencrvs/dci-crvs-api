import type { SearchEventsQueryVariables } from "opencrvs-api";
import type { components } from "dci-api";
import { ParseError } from "./error";

export function searchRequestToAdvancedSearchParameters(
  request: components["schemas"]["SearchRequest"]["search_request"][number]
): SearchEventsQueryVariables {
  const query = request.search_criteria.query as {
    identifiers?: Array<{
      identifier_type: "BRN" | string;
      identifier_value: string;
    }>;
  };
  const sort = request.search_criteria.sort as
    | Array<{
        attribute_name: "dateOfDeclaration";
        sort_order: "asc" | "desc";
      }>
    | undefined;
  const parameters: SearchEventsQueryVariables["advancedSearchParameters"] = {};
  // let sortOrder: "asc" | "desc" = "asc";
  let sortColumn: string | undefined;

  // TODO: Support more than one identifier
  if (query.identifiers?.[0]?.identifier_type === "BRN") {
    parameters.registrationNumber = query.identifiers[0].identifier_value;
  } else if (query.identifiers?.[0]?.identifier_type === "DRN") {
    parameters.registrationNumber = query.identifiers[0].identifier_value;
  } else if (query.identifiers?.[0]?.identifier_type === "MRN") {
    parameters.registrationNumber = query.identifiers[0].identifier_value;
  } else if (query.identifiers?.[0]?.identifier_type === "OPENCRVS_RECORD_ID") {
    parameters.recordId = query.identifiers[0].identifier_value;
  } else {
    throw new ParseError("Unsupported identifier type");
  }

  if ((sort?.length ?? 0) > 1) {
    throw new ParseError("Sorting by more than one attribute is not supported");
  }

  if (sort?.[0]?.attribute_name === "dateOfDeclaration") {
    sortColumn = "dateOfDeclaration";
  }

  if (sort?.[0]?.sort_order !== undefined) {
    // sortOrder = sort?.[0]?.sort_order;
  }

  return { advancedSearchParameters: parameters, sort: sortColumn };
}
