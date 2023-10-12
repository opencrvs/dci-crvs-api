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
  address?: string
  containedInPlace?: Place
}

export function place({ identifier, address, containedInPlace }: Place): {
  '@type': 'spdci:Place'
} & Place {
  return {
    '@type': 'spdci:Place',
    identifier,
    address,
    containedInPlace: containedInPlace && place(containedInPlace)
  }
}
