import { type JWK, type KeyLike, calculateJwkThumbprint, exportJWK } from 'jose'
import { getEncryptionKeys, getSigningKeys } from '../crypto/keys'

async function getJwk(publicKey: KeyLike, use: 'sig' | 'enc'): Promise<JWK> {
  const jwk = await exportJWK(publicKey)
  jwk.kid = await calculateJwkThumbprint(jwk)
  jwk.use = use
  return jwk
}

export async function getJwksHandler() {
  const [{ publicKey: signingKey }, { publicKey: encryptionKey }] =
    await Promise.all([getSigningKeys(), getEncryptionKeys()])
  const keys = await Promise.all([
    getJwk(signingKey, 'sig'),
    getJwk(encryptionKey, 'enc')
  ])
  return {
    keys
  }
}
