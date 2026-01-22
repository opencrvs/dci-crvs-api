import type * as Hapi from '@hapi/hapi'
import { createClient } from '@opencrvs/toolkit/api'
import { OPENCRVS_EVENTS_URL } from '../constants'
import { parseToken } from '../auth'
import { AuthorizationError } from '../error'
import { type ReqResWithAuthorization } from '../server'

/**
 * Note! This follows NO standard. It's a custom endpoint to expose location data
 * from OpenCRVS in a well-known location so that other services (like DCI)
 * can easily discover and consume it.
 */
export async function getLocationsHandler(
  request: Hapi.Request<ReqResWithAuthorization>,
  _h: Hapi.ResponseToolkit
) {
  const header = request.headers.authorization
  if (header === undefined) {
    throw new AuthorizationError('Authorization header is missing')
  }
  const token = parseToken(header)

  const client = createClient(OPENCRVS_EVENTS_URL, `Bearer ${token}`)

  try {
    const locations = await client.locations.list.query({})
    return locations
  } catch (e: any) {
    console.error('Error fetching locations:', e)
    throw new AuthorizationError('Failed to fetch locations')
  }
}
