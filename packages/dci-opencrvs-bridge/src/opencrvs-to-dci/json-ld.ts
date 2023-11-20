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
  identifier?: string | IdentifierPropertyValue[]
  name?: string
  address?: string
  containedInPlace?: Place | string | null
  additionalType?: string
  type?: string
}

export function place({
  identifier,
  address,
  containedInPlace,
  name,
  additionalType
}: Place): {
  '@type': `Place`
} & Place {
  return {
    '@type': `Place`,
    additionalType,
    identifier,
    address,
    name,
    containedInPlace
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
