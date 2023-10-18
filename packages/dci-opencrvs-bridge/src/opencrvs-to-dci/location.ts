import { type SavedLocation } from 'opencrvs-api'
import { place } from './json-ld'

export function fhirLocationsToJsonLd(
  locations: SavedLocation[],
  { lastUpdated }: { lastUpdated: string }
) {
  return {
    '@context': {
      '@context': 'http://spdci.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      schema: 'http://schema.org/'
    },
    lastUpdated,
    locations: locations.map((location) =>
      place({
        identifier: [{ name: 'opencrvs-location', identifier: location.id }],
        name: location.name,
        additionalType: location.type?.coding?.[0].code,
        containedInPlace:
          location.partOf?.reference.split('/')[1] === '0'
            ? null
            : location.partOf?.reference.split('/')[1]
      })
    )
  }
}
