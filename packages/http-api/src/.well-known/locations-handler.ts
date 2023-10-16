import { fhirLocationsToJsonLd } from 'dci-opencrvs-bridge'
import { memoize } from 'lodash/fp'
import { fetchFHIRLocations } from 'opencrvs-api'

const memoizedFetchFHIRLocations = memoize(fetchFHIRLocations)

export async function getLocationsHandler() {
  const locations = await memoizedFetchFHIRLocations()
  return fhirLocationsToJsonLd(locations.entry.map((entry) => entry.resource))
}
