import {
  type Person,
  type BirthRegistration as BirthRegistrationWithOptionals,
  type DeathRegistration as DeathRegistrationWithOptionals,
  type MarriageRegistration,
  type Scalars,
  type Address,
  type HumanName as HumanNameWithOptionals,
} from "./gateway";

type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> &
  Omit<T, K> extends infer O
  ? { [P in keyof O]: O[P] }
  : never;

type HumanName = RequireKeys<
  HumanNameWithOptionals,
  "firstNames" | "familyName" | "__typename"
>;

interface Child extends Person {
  __typename?: "Person";
  address: Address[];
  age: Scalars["Float"];
  ageOfIndividualInYears: Scalars["Int"];
  birthDate: Scalars["String"];
  gender: Scalars["String"];
  id: Scalars["ID"];
  name: [HumanName, ...HumanName[]];
}

export interface BirthRegistration extends BirthRegistrationWithOptionals {
  child: Child;
}

interface Deceased extends Person {
  deceased: NonNullable<Person["deceased"]>;
  gender: Scalars["String"];
  name: [HumanName, ...HumanName[]];
}

export interface DeathRegistration extends DeathRegistrationWithOptionals {
  deceased: Deceased;
}

export type Registration =
  | BirthRegistration
  | DeathRegistration
  | MarriageRegistration;

export type {
  MarriageRegistration,
  IdentityType,
  SearchEventsQueryVariables,
} from "./gateway";
