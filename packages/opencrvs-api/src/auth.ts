import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { AuthorizationError } from './error'
import { OPENCRVS_AUTH_URL } from './constants'

async function getPublicKey() {
  const response = await fetch(new URL('.well-known', OPENCRVS_AUTH_URL))
  if (!response.ok) {
    throw new Error('Authentication server did not return a proper .well-known')
  }
  return await response.text()
}

export async function validateToken(token: string) {
  const publicKey = await getPublicKey()
  try {
    jwt.verify(token, publicKey, {
      issuer: 'opencrvs:auth-service',
      audience: ['opencrvs:gateway-user', 'opencrvs:search-user']
    })
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      throw new AuthorizationError('Token expired')
    }

    throw new AuthorizationError('Failed to verify jwt')
  }
}
