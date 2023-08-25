import { SearchCriteria } from "opencrvs-api";
import { components } from "dci-api";

export function searchRequestToAdvancedSearchParameters(
  request: components["schemas"]["SearchRequest"]
): SearchCriteria {
  const query = request.search_request[0].search_criteria.query as {
    identifiers?: Array<{
      identifier_type: "UIN";
      identifier_value: string;
    }>;
  };

  if (query.identifiers) {
    return {
      parameters: {
        nationalId: query.identifiers[0].identifier_value,
      },
    };
  }

  throw new Error("Unsupported search request");
}
