import { type JWK, type KeyLike, calculateJwkThumbprint, exportJWK } from 'jose'
import { getEncryptionKeys, getSigningKeys } from '../crypto/keys'

async function getJwk(
  publicKey: KeyLike,
  use: 'sig' | 'enc',
  alg: 'RSA-256' | 'RSA-OAEP-256'
): Promise<JWK> {
  const jwk = await exportJWK(publicKey)
  jwk.kid = await calculateJwkThumbprint(jwk)
  jwk.use = use
  jwk.alg = alg
  return jwk
}

export async function getJwksHandler() {
  const [{ publicKey: signingKey }, { publicKey: encryptionKey }] =
    await Promise.all([getSigningKeys(), getEncryptionKeys()])
  const keys = await Promise.all([
    getJwk(signingKey, 'sig', 'RSA-256'),
    getJwk(encryptionKey, 'enc', 'RSA-OAEP-256')
  ])
  return {
    keys
  }
}
