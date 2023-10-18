import { type SavedLocation } from 'opencrvs-api'
import { place } from './json-ld'

export function fhirLocationsToJsonLd(locations: SavedLocation[]) {
  return locations.map((location) =>
    place({
      identifier: `ocrvs:${location.id}`,
      name: location.name,
      type: location.type?.coding?.[0].code,
      containedInPlace: `ocrvs:${location.partOf?.reference.split('/')[1]}`
    })
  )
}
