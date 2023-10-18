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
  type?: string
}

export function place({
  identifier,
  address,
  containedInPlace,
  name,
  type
}: Place): {
  '@type': `spdci:Place${`#${string}` | ''}`
} & Place {
  return {
    '@type': `spdci:Place${type === undefined ? '' : (`#${type}` as const)}`,
    identifier,
    address,
    name,
    containedInPlace
  }
}
