import { type TypeOf } from 'zod'
import {
  type maybeEncryptedSyncSearchRequestSchema,
  type maybeEncryptedAsyncSearchRequestSchema,
  type AsyncSearchRequest,
  type SyncSearchRequest,
  searchRequestSchema
} from '../validations'
import { getEncryptionKeys } from './keys'
import { flattenedDecrypt } from 'jose'
import { ValidationError, fromZodError } from 'zod-validation-error'

function notEncrypted(
  maybeEncryptedPayload:
    | TypeOf<typeof maybeEncryptedSyncSearchRequestSchema>
    | TypeOf<typeof maybeEncryptedAsyncSearchRequestSchema>
): maybeEncryptedPayload is SyncSearchRequest | AsyncSearchRequest {
  return !maybeEncryptedPayload.header.is_msg_encrypted
}

export async function decryptPayload(
  maybeEncryptedPayload: TypeOf<typeof maybeEncryptedAsyncSearchRequestSchema>
): Promise<AsyncSearchRequest>
export async function decryptPayload(
  maybeEncryptedSyncPayload: TypeOf<
    typeof maybeEncryptedSyncSearchRequestSchema
  >
): Promise<SyncSearchRequest>
export async function decryptPayload(
  maybeEncryptedPayload:
    | TypeOf<typeof maybeEncryptedSyncSearchRequestSchema>
    | TypeOf<typeof maybeEncryptedAsyncSearchRequestSchema>
): Promise<SyncSearchRequest | AsyncSearchRequest> {
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
