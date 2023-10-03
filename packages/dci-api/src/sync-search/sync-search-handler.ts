import type * as Hapi from '@hapi/hapi'
import { advancedRecordSearch, fetchRegistration } from 'opencrvs-api'
import {
  registrySyncSearchBuilder,
  AuthorizationError,
  searchRequestToAdvancedSearchParameters
} from 'dci-opencrvs-bridge'
import { compact } from 'lodash/fp'
import {
  type SyncSearchRequest,
  syncSearchRequestSchema,
  encryptedSyncSearchRequestSchema,
  searchRequestSchema
} from '../validations'
import { fromZodError } from 'zod-validation-error'
import { ValidationError } from '../error'
import { parseToken } from '../auth'
import { type ReqResWithAuthorization } from '../server'
import { withSignature } from '../crypto/sign'
import { type operations } from '../registry-core-api'
import { verifySignature } from '../crypto/verify'
import { type TypeOf } from 'zod'
import { flattenedDecrypt } from 'jose'
import { getEncryptionKeys } from '../crypto/keys'

async function fetchRegistrations(token: string, ids: string[]) {
  return await Promise.all(
    ids.map(async (id) => await fetchRegistration(token, id))
  )
}

export async function search(
  token: string,
  request: SyncSearchRequest['message']
) {
  const searchRequests = request.search_request
  const searchResults = await Promise.all(
    searchRequests.map(async (searchRequest) => {
      const response = await advancedRecordSearch(
        token,
        searchRequestToAdvancedSearchParameters(searchRequest)
      )

      const responseIds = compact(
        response?.results?.map((result) => result?.id)
      )
      const registrations = await fetchRegistrations(token, responseIds)

      return {
        registrations: compact(registrations),
        responseFinishedTimestamp: new Date(),
        originalRequest: searchRequest
      }
    })
  )

  return searchResults
}

const maybeEncryptedSchema = syncSearchRequestSchema.or(
  encryptedSyncSearchRequestSchema
)

function notEncrypted(
  maybeEncryptedPayload: TypeOf<typeof maybeEncryptedSchema>
): maybeEncryptedPayload is SyncSearchRequest {
  return !maybeEncryptedPayload.header.is_msg_encrypted
}

async function decryptPayload(
  maybeEncryptedPayload: TypeOf<typeof maybeEncryptedSchema>
): Promise<SyncSearchRequest> {
  if (notEncrypted(maybeEncryptedPayload)) {
    return maybeEncryptedPayload
  }
  const encryptedPayload = maybeEncryptedPayload
  const { privateKey } = await getEncryptionKeys()
  const { plaintext } = await flattenedDecrypt(
    encryptedPayload.message,
    privateKey
  )
  const result = searchRequestSchema.safeParse(
    JSON.parse(new TextDecoder().decode(plaintext))
  )
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  return {
    ...encryptedPayload,
    message: result.data
  }
}

export async function syncSearchHandler(
  request: Hapi.Request<ReqResWithAuthorization>,
  _h: Hapi.ResponseToolkit
) {
  const result = maybeEncryptedSchema.safeParse(request.payload)
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  const header = request.headers.authorization
  if (header === undefined) {
    throw new AuthorizationError('Authorization header is missing')
  }
  const token = parseToken(header)
  const payload = await decryptPayload(result.data)

  await verifySignature(payload, syncSearchRequestSchema)

  const results = await search(token, payload.message)
  return (await withSignature(
    registrySyncSearchBuilder(results, payload)
  )) satisfies operations['post_reg_sync_search']['responses']['default']['content']['application/json']
}
