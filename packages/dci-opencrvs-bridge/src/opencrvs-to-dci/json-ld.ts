import { NameFieldValue } from '@opencrvs/toolkit/events'

export function withContext<T extends Record<string, any>>(json: T) {
  return {
    '@context': {
      '@vocab': 'http://spdci.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      schema: 'http://schema.org/'
    },
    ...json
  }
}

interface IdentifierPropertyValue {
  name: string
  identifier: string
}

interface Place {
  name?: string
  contained_in_place?: Place | string | null
  address_line?: string
}

export function place({ address_line, contained_in_place, name }: Place): {
  '@type': `Place`
} & Place {
  return {
    '@type': `Place`,
    address_line,
    name,
    contained_in_place
  }
}

export function mother({
  identifier,
  givenName,
  additionalName,
  familyName,
  gender,
  homeLocation
}: {
  identifier?: string | IdentifierPropertyValue[]
  gender?: string
  givenName?: string
  additionalName?: string
  familyName?: string
  homeLocation?: string
}) {
  return {
    '@type': `spdci:Mother`,
    identifier,
    givenName,
    additionalName,
    familyName,
    gender,
    homeLocation
  }
}

export function father({
  identifier,
  givenName,
  additionalName,
  familyName,
  gender,
  homeLocation
}: {
  identifier?: string | IdentifierPropertyValue[]
  gender?: string
  givenName?: string
  additionalName?: string
  familyName?: string
  homeLocation?: string
}) {
  return {
    '@type': `spdci:Father`,
    identifier,
    givenName,
    additionalName,
    familyName,
    gender,
    homeLocation
  }
}

export function identifier({ type, value }: { type: string; value: string }) {
  return {
    '@id': 'Identifier',
    '@type': 'Identifier',
    identifier_type: type,
    identifier_value: value
  }
}

export function name(name: NameFieldValue) {
  return {
    '@type': 'Name',
    given_name: name.firstname,
    second_name: name.middlename,
    surname: name.surname
  }
}
