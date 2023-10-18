import { fhirLocationsToJsonLd } from 'dci-opencrvs-bridge'
import { memoize } from 'lodash/fp'
import { fetchFHIRLocations } from 'opencrvs-api'

const memoizedFetchFHIRLocations = memoize(fetchFHIRLocations)

export async function getLocationsHandler() {
  const locations = await memoizedFetchFHIRLocations()

  if (locations.meta?.lastUpdated === undefined) {
    throw new Error("FHIR API didn't have a lastUpdated field")
  }

  return fhirLocationsToJsonLd(
    locations.entry.map((entry) => entry.resource),
    { lastUpdated: locations.meta?.lastUpdated }
  )
}
