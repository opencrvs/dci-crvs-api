import {
  FlattenedEncrypt,
  type FlattenedJWE,
  calculateJwkThumbprint,
  createRemoteJWKSet
} from 'jose'
import { type components } from '../registry-core-api'

function jweToEncryptedMessage(
  jwe: FlattenedJWE
): components['schemas']['EncryptedMessage'] {
  if (jwe.header?.alg === undefined) {
    throw new Error('Missing required header paramater "alg" after encrypting')
  }
  if (jwe.header.enc === undefined) {
    throw new Error('Missing required header paramater "enc" after encrypting')
  }
  if (jwe.header.kid === undefined) {
    throw new Error('Missing required header paramater "kid" after encrypting')
  }
  if (jwe.encrypted_key === undefined) {
    throw new Error('encrypted_key is required after encrypting')
  }
  return {
    ...jwe,
    header: {
      alg: jwe.header.alg,
      enc: jwe.header.enc,
      kid: jwe.header.kid,
      ...jwe.header
    },
    encrypted_key: jwe.encrypted_key
  }
}

export async function encryptPayload(
  jwksUrl: string,
  payload: components['schemas']['SearchResponse']
): Promise<components['schemas']['EncryptedMessage']> {
  const publicKey = await createRemoteJWKSet(new URL(jwksUrl))({ use: 'enc' })
  const jwe = await new FlattenedEncrypt(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setUnprotectedHeader({
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM',
      kid: await calculateJwkThumbprint(publicKey)
    })
    .encrypt(publicKey)
  return jweToEncryptedMessage(jwe)
}
