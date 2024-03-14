import { FlattenedEncrypt, type FlattenedJWE, importJWK } from 'jose'
import { type components } from '../registry-core-api'
import { z } from 'zod'
import { ValidationError, fromZodError } from 'zod-validation-error'

function jweToEncryptedMessage(
  jwe: FlattenedJWE
): components['schemas']['EncryptedMessage'] {
  if (jwe.header?.alg === undefined) {
    throw new Error(
      'Missing required jwe.header paramater "alg" after encrypting'
    )
  }
  if (jwe.header.enc === undefined) {
    throw new Error(
      'Missing required jwe.header paramater "enc" after encrypting'
    )
  }
  if (jwe.header.kid === undefined) {
    throw new Error(
      'Missing required jwe.header paramater "kid" after encrypting'
    )
  }
  if (jwe.encrypted_key === undefined) {
    throw new Error('jwe.encrypted_key is required after encrypting')
  }
  if (jwe.tag === undefined) {
    throw new Error('jwe.tag is required after encrypting')
  }
  if (jwe.iv === undefined) {
    throw new Error('jwe.iv is required after encrypting')
  }
  return {
    ...jwe,
    header: {
      alg: jwe.header.alg,
      enc: jwe.header.enc,
      kid: jwe.header.kid,
      ...jwe.header
    },
    tag: jwe.tag,
    iv: jwe.iv,
    encrypted_key: jwe.encrypted_key
  }
}

const jwkSchema = z
  .object({
    kty: z.string(),
    kid: z.string(),
    use: z.enum(['sig', 'enc']),
    alg: z.string()
  })
  .passthrough()

const jwksSchema = z.object({
  keys: z.array(jwkSchema)
})

export async function encryptPayload(
  jwksUrl: string,
  payload: components['schemas']['SearchResponse']
): Promise<components['schemas']['EncryptedMessage']> {
  const url = new URL(jwksUrl)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON Web Key Set from ${url.href}`)
  }
  const result = jwksSchema.safeParse(await response.json())
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  const jwks = result.data
  // we are only checking against the "use" parameter
  // for now but should be made stricter with the "kid"
  // in the future
  const jwk = jwks.keys.find((jwk) => jwk.use === 'enc')
  if (jwk === undefined) {
    throw new Error('No jwk found for encryption')
  }
  const publicKey = await importJWK(jwk)
  const jwe = await new FlattenedEncrypt(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setUnprotectedHeader({
      alg: jwk.alg,
      enc: 'A256GCM',
      kid: jwk.kid
    })
    .encrypt(publicKey)
  return jweToEncryptedMessage(jwe)
}
