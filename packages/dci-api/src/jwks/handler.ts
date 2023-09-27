import { exportJWK } from 'jose'
import { getSigningKeys } from '../crypto/keys'

export async function getJwksHandler() {
  const signingKeys = await getSigningKeys()
  return {
    keys: [await exportJWK(signingKeys.publicKey)]
  }
}
