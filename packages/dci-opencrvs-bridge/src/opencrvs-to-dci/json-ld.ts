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

interface Place {
  identifier?: `ocrvs:${string}`
  name?: string
  address?: string
  containedInPlace?: Place | `ocrvs:${string}`
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
