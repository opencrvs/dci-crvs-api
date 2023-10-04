import { FlattenedEncrypt, createRemoteJWKSet } from 'jose'
import { type components } from '../registry-core-api'

export async function encryptPayload(
  jwksUrl: string,
  payload: components['schemas']['SearchResponse']
): Promise<components['schemas']['EncryptedMessage']> {
  const publicKey = await createRemoteJWKSet(new URL(jwksUrl))({ use: 'enc' })
  const jwe = await new FlattenedEncrypt(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setUnprotectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(publicKey)
  return jwe
}
