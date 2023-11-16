import { OPENCRVS_FHIR_LOCATION_API } from './constants'
import type { SavedLocation, Bundle } from '@opencrvs/commons/build/dist/fhir'

const ADMIN_STRUCTURE_API = new URL(OPENCRVS_FHIR_LOCATION_API)
ADMIN_STRUCTURE_API.searchParams.append('type', 'ADMIN_STRUCTURE')

const HEALTH_FACILITIES_API = new URL(OPENCRVS_FHIR_LOCATION_API)
HEALTH_FACILITIES_API.searchParams.append('type', 'HEALTH_FACILITY')

const CRVS_OFFICE_API = new URL(OPENCRVS_FHIR_LOCATION_API)
CRVS_OFFICE_API.searchParams.append('type', 'CRVS_OFFICE')

export async function fetchFHIRLocations() {
  const adminStructureRequest = fetch(ADMIN_STRUCTURE_API)
  const healthFacilitiesRequest = fetch(HEALTH_FACILITIES_API)
  const crvsOfficeRequest = fetch(CRVS_OFFICE_API)

  const [adminStructure, healthFacilities, crvsOffice] = await Promise.all([
    adminStructureRequest,
    healthFacilitiesRequest,
    crvsOfficeRequest
  ])

  if (!adminStructure.ok) {
    throw new Error(
      `Something went wrong in FHIR Location: Admin Structure API: ${JSON.stringify(
        await adminStructure.json(),
        null,
        4
      )}`
    )
  }

  if (!healthFacilities.ok) {
    throw new Error(
      `Something went wrong in FHIR Location: Health Facilities API: ${JSON.stringify(
        await healthFacilities.json(),
        null,
        4
      )}`
    )
  }

  if (!crvsOffice.ok) {
    throw new Error(
      `Something went wrong in FHIR Location: CRVS Office API: ${JSON.stringify(
        await crvsOffice.json(),
        null,
        4
      )}`
    )
  }

  const adminStructureJson =
    (await adminStructure.json()) as Bundle<SavedLocation>
  const healthFacilitiesJson =
    (await healthFacilities.json()) as Bundle<SavedLocation>
  const crvsOfficeJson = (await crvsOffice.json()) as Bundle<SavedLocation>

  return {
    ...adminStructureJson,
    entry: [
      ...adminStructureJson.entry,
      ...healthFacilitiesJson.entry,
      ...crvsOfficeJson.entry
    ]
  } satisfies Bundle<SavedLocation>
}

export type { SavedLocation }
