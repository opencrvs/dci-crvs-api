import { compactVerify, createRemoteJWKSet } from 'jose'
import {
  type MaybeEncryptedAsyncSearchRequest,
  type MaybeEncryptedSyncSearchRequest
} from '../validations'
import { type ZodSchema } from 'zod'
import { isEqual } from 'lodash/fp'
import { ValidationError } from 'zod-validation-error'

async function verifyJws(jws: string, jwksUrl: string): Promise<unknown> {
  const JWKS = createRemoteJWKSet(new URL(jwksUrl))
  const { payload: signedPayload } = await compactVerify(jws, JWKS)
  return JSON.parse(new TextDecoder().decode(signedPayload))
}

export async function verifySignature(
  {
    signature,
    ...payload
  }: MaybeEncryptedSyncSearchRequest | MaybeEncryptedAsyncSearchRequest,
  validationSchema: ZodSchema
) {
  if (signature === undefined) {
    return
  }
  try {
    const signedPayload = await verifyJws(
      signature,
      `${payload.header.sender_id}/.well-known/jwks.json`
    )
    const parsedSignedPayload = validationSchema.safeParse(signedPayload)
    if (
      !parsedSignedPayload.success ||
      !isEqual(parsedSignedPayload.data, payload)
    ) {
      throw new Error()
    }
  } catch (e) {
    throw new ValidationError('Signature verification failed')
  }
}
