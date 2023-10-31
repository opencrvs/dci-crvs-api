import { OPENCRVS_FHIR_LOCATION_API } from './constants'
import type { SavedLocation, Bundle } from '@opencrvs/commons/build/dist/fhir'

export async function fetchFHIRLocations() {
  const request = await fetch(OPENCRVS_FHIR_LOCATION_API)

  if (!request.ok) {
    throw new Error('Something went wrong in FHIR Location API')
  }

  return (await request.json()) as Bundle<SavedLocation>
}

export type { SavedLocation }
