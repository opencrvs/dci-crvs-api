const enum GQLEvent {
  birth = "birth",
  death = "death",
  marriage = "marriage",
}

interface GQLAdvancedSearchParametersInput {
  event?: GQLEvent;
  name?: string;
  registrationStatuses?: Array<string | null>;
  dateOfEvent?: string;
  dateOfEventStart?: string;
  dateOfEventEnd?: string;
  contactNumber?: string;
  nationalId?: string;
  registrationNumber?: string;
  trackingId?: string;
  recordId?: string;
  dateOfRegistration?: string;
  dateOfRegistrationStart?: string;
  dateOfRegistrationEnd?: string;
  declarationLocationId?: string;
  declarationJurisdictionId?: string;
  eventLocationId?: string;
  eventCountry?: string;
  eventLocationLevel1?: string;
  eventLocationLevel2?: string;
  eventLocationLevel3?: string;
  eventLocationLevel4?: string;
  eventLocationLevel5?: string;
  childFirstNames?: string;
  childLastName?: string;
  childDoB?: string;
  childDoBStart?: string;
  childDoBEnd?: string;
  childGender?: string;
  deceasedFirstNames?: string;
  deceasedFamilyName?: string;
  deceasedGender?: string;
  deceasedDoB?: string;
  deceasedDoBStart?: string;
  deceasedDoBEnd?: string;
  deceasedIdentifier?: string;
  groomFirstNames?: string;
  groomFamilyName?: string;
  groomDoB?: string;
  groomDoBStart?: string;
  groomDoBEnd?: string;
  groomIdentifier?: string;
  brideFirstNames?: string;
  brideFamilyName?: string;
  brideDoB?: string;
  brideDoBStart?: string;
  brideDoBEnd?: string;
  brideIdentifier?: string;
  dateOfMarriage?: string;
  motherFirstNames?: string;
  motherFamilyName?: string;
  motherDoB?: string;
  motherDoBStart?: string;
  motherDoBEnd?: string;
  motherIdentifier?: string;
  fatherFirstNames?: string;
  fatherFamilyName?: string;
  fatherDoB?: string;
  fatherDoBStart?: string;
  fatherDoBEnd?: string;
  fatherIdentifier?: string;
  informantFirstNames?: string;
  informantFamilyName?: string;
  informantDoB?: string;
  informantDoBStart?: string;
  informantDoBEnd?: string;
  informantIdentifier?: string;
  compositionType?: Array<string | null>;
}

export interface SearchCriteria {
  parameters: GQLAdvancedSearchParametersInput;
  sort?: string;
  sortColumn?: string;
  size?: number;
  from?: number;
  createdBy?: string;
}

interface ShardsResponse {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

interface Explanation {
  value: number;
  description: string;
  details: Explanation[];
}

export interface SearchResponse<T> {
  took: number;
  timed_out: boolean;
  _scroll_id?: string;
  _shards: ShardsResponse;
  hits: {
    total: { value: number; eq: string };
    max_score: number;
    hits: Array<{
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: T;
      _version?: number;
      _explanation?: Explanation;
      fields?: any;
      highlight?: any;
      inner_hits?: any;
      matched_queries?: string[];
      sort?: string[];
    }>;
  };
  aggregations?: any;
}
