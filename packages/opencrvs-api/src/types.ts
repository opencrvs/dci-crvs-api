import {
  type Person,
  type BirthRegistration as BirthRegistrationWithOptionals,
  type DeathRegistration as DeathRegistrationWithOptionals,
  type MarriageRegistration as MarriageRegistrationWithOptionals,
  type Scalars,
  type Address,
  type Location as LocationWithOptionals,
  type HumanName as HumanNameWithOptionals
} from './gateway'

type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> &
  Omit<T, K> extends infer O
  ? { [P in keyof O]: O[P] }
  : never

type HumanName = RequireKeys<
  HumanNameWithOptionals,
  'firstNames' | 'familyName' | '__typename'
>

interface Child extends Person {
  __typename?: 'Person'
  address: Address[]
  age: Scalars['Float']['output']
  ageOfIndividualInYears: Scalars['Int']['output']
  birthDate: Scalars['String']['output']
  gender: Scalars['String']['output']
  id: Scalars['ID']['output']
  name: [HumanName, ...HumanName[]]
}

interface Location extends LocationWithOptionals {
  partOf: `Location/${string}`
}

export interface BirthRegistration extends BirthRegistrationWithOptionals {
  child: Child
  eventLocation: Location
}

interface Deceased extends Person {
  deceased: NonNullable<Person['deceased']>
  gender: Scalars['String']['output']
  name: [HumanName, ...HumanName[]]
}

export interface DeathRegistration extends DeathRegistrationWithOptionals {
  deceased: Deceased
  eventLocation: Location
}

interface MarriedPerson extends Person {
  name: [HumanName, ...HumanName[]]
}

export interface MarriageRegistration
  extends MarriageRegistrationWithOptionals {
  groom: MarriedPerson
  bride: MarriedPerson
  eventLocation: Location
}

export type Registration =
  | BirthRegistration
  | DeathRegistration
  | MarriageRegistration

export type { IdentityType, SearchEventsQueryVariables } from './gateway'
export { Event } from './gateway'
