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

enum EVENT {
  BIRTH = "Birth",
  DEATH = "Death",
  MARRIAGE = "Marriage",
}

interface IAssignment {
  userId: string;
  firstName: string;
  lastName: string;
  officeName: string;
}

interface ICorrection {
  section: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
}

interface IOperationHistory {
  operationType: string;
  operatedOn: string;
  operatorRole: string;
  operatorFirstNames: string;
  operatorFamilyName: string;
  operatorFirstNamesLocale: string;
  operatorFamilyNameLocale: string;
  operatorOfficeName: string;
  operatorOfficeAlias: string[];
  rejectReason?: string;
  rejectComment?: string;
  notificationFacilityName?: string;
  notificationFacilityAlias?: string[];
  correction?: ICorrection[];
}

interface ICompositionBody {
  compositionId?: string;
  compositionType?: string;
  event?: EVENT;
  type?: string;
  contactRelationship?: string;
  contactNumber?: string;
  contactEmail?: string;
  dateOfDeclaration?: string;
  trackingId?: string;
  registrationNumber?: string;
  eventLocationId?: string;
  eventJurisdictionIds?: string[];
  eventCountry?: string;
  declarationLocationId?: string;
  declarationJurisdictionIds?: string[];
  rejectReason?: string;
  rejectComment?: string;
  relatesTo?: string[];
  childFirstNames?: string;
  childFamilyName?: string;
  childFirstNamesLocal?: string;
  motherFirstNames?: string;
  motherFamilyName?: string;
  motherDoB?: string;
  motherIdentifier?: string;
  childDoB?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  modifiedAt?: string;
  assignment?: IAssignment | null;
  operationHistories?: IOperationHistory[];
}

export interface BirthCompositionBody extends ICompositionBody {
  childFirstNames?: string;
  childFamilyName?: string;
  childFirstNamesLocal?: string;
  childFamilyNameLocal?: string;
  childDoB?: string;
  gender?: string;
  motherFirstNames?: string;
  motherFamilyName?: string;
  motherFirstNamesLocal?: string;
  motherFamilyNameLocal?: string;
  motherDoB?: string;
  motherIdentifier?: string;
  fatherFirstNames?: string;
  fatherFamilyName?: string;
  fatherFirstNamesLocal?: string;
  fatherFamilyNameLocal?: string;
  fatherDoB?: string;
  fatherIdentifier?: string;
  informantFirstNames?: string;
  informantFamilyName?: string;
  informantFirstNamesLocal?: string;
  informantFamilyNameLocal?: string;
  informantDoB?: string;
  informantIdentifier?: string;
}

/** Birth composition asserting that certain values should exist */
export interface BirthComposition extends BirthCompositionBody {
  childFirstNames: string;
  childFamilyName: string;
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
