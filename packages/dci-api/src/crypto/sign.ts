import { CompactSign } from 'jose'
import { getSigningKeys } from './keys'
import { type components } from '../registry-core-api'

export async function withSignature<A extends Record<PropertyKey, unknown>>(
  responsePayload: A
): Promise<A & { signature: components['schemas']['MsgSignature'] }> {
  return {
    ...responsePayload,
    signature: await generateSignature(responsePayload)
  }
}

async function generateSignature(payload: unknown) {
  const { privateKey } = await getSigningKeys()
  return await new CompactSign(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setProtectedHeader({ alg: 'RS256' })
    .sign(privateKey)
}
