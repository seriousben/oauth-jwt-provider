import { generateKeyPair, exportJWK, SignJWT } from 'jose'

export interface KeyPairWithId {
  keyPair: CryptoKeyPair
  kid: string
  publicJWK: Record<string, unknown>
}

/**
 * Generate RSA-2048 key pair for JWT signing
 * Returns key pair with unique kid and exported public JWK
 */
export async function createKeyPair(): Promise<KeyPairWithId> {
  const keyPair = await generateKeyPair('RS256', { modulusLength: 2048 })
  const kid = crypto.randomUUID()
  const publicJWK = await createPublicJWK(keyPair.publicKey, kid)

  return { keyPair, kid, publicJWK }
}

/**
 * Export public key to JWK format (RFC 7517)
 */
export async function createPublicJWK(
  publicKey: CryptoKey,
  kid: string
): Promise<Record<string, unknown>> {
  const jwk = await exportJWK(publicKey)

  return {
    ...jwk,
    kid,
    use: 'sig',
    alg: 'RS256'
  }
}

/**
 * Sign JWT with RS256 (RFC 7523)
 */
export async function signJWT(
  payload: Record<string, unknown>,
  privateKey: CryptoKey,
  kid: string,
  expirationSeconds?: number
): Promise<string> {
  const jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid })
    .setIssuedAt()
    .setExpirationTime(expirationSeconds ? `${expirationSeconds}s` : '1h')
    .setJti(crypto.randomUUID())

  // Set iss, sub, aud from payload
  if (payload.iss) {
    jwt.setIssuer(payload.iss as string)
  }
  if (payload.sub) {
    jwt.setSubject(payload.sub as string)
  }
  if (payload.aud) {
    if (Array.isArray(payload.aud)) {
      jwt.setAudience(payload.aud as string[])
    } else {
      jwt.setAudience(payload.aud as string)
    }
  }

  return await jwt.sign(privateKey)
}
