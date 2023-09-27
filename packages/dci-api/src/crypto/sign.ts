import { CompactSign } from 'jose'
import { getSigningKeys } from './keys'

export async function generateSignature(payload: unknown) {
  const { privateKey } = await getSigningKeys()
  return await new CompactSign(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setProtectedHeader({ alg: 'RS256' })
    .sign(privateKey)
}
