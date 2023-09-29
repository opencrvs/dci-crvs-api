import { compactVerify, createRemoteJWKSet } from 'jose'

export async function verifySignature(
  jws: string,
  jwksUrl: string
): Promise<unknown> {
  const JWKS = createRemoteJWKSet(new URL(jwksUrl))
  const { payload: signedPayload } = await compactVerify(jws, JWKS)
  return JSON.parse(new TextDecoder().decode(signedPayload))
}
