import { generateKeyPair } from 'jose'

type KeyPairPromise = ReturnType<typeof generateKeyPair>

let signingKeys: Awaited<KeyPairPromise> | undefined

export async function getSigningKeys(): KeyPairPromise {
  if (signingKeys === undefined) {
    signingKeys = await generateKeyPair('RS256')
  }
  return signingKeys
}

let encryptionKeys: Awaited<KeyPairPromise> | undefined

export async function getEncryptionKeys(): KeyPairPromise {
  if (encryptionKeys === undefined) {
    encryptionKeys = await generateKeyPair('RS256')
  }
  return encryptionKeys
}
