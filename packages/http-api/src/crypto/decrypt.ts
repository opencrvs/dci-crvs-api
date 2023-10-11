import {
  type MaybeEncryptedSyncSearchRequest,
  type MaybeEncryptedAsyncSearchRequest,
  type AsyncSearchRequest,
  type SyncSearchRequest,
  searchRequestSchema
} from '../validations'
import { getEncryptionKeys } from './keys'
import { flattenedDecrypt } from 'jose'
import { ValidationError, fromZodError } from 'zod-validation-error'

function notEncrypted(
  maybeEncryptedPayload:
    | MaybeEncryptedSyncSearchRequest
    | MaybeEncryptedAsyncSearchRequest
): maybeEncryptedPayload is SyncSearchRequest | AsyncSearchRequest {
  return !maybeEncryptedPayload.header.is_msg_encrypted
}

export async function decryptPayload(
  maybeEncryptedPayload: MaybeEncryptedAsyncSearchRequest
): Promise<AsyncSearchRequest>
export async function decryptPayload(
  maybeEncryptedSyncPayload: MaybeEncryptedSyncSearchRequest
): Promise<SyncSearchRequest>
export async function decryptPayload(
  maybeEncryptedPayload:
    | MaybeEncryptedSyncSearchRequest
    | MaybeEncryptedAsyncSearchRequest
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
