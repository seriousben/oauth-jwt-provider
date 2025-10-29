import { generateKeyPair, exportJWK, SignJWT, importJWK } from 'jose'

export interface KeyPairWithId {
  keyPair: CryptoKeyPair
  kid: string
  publicJWK: Record<string, unknown>
}

/**
 * Static RSA-2048 key pair for JWT signing
 * Generated once and hardcoded to ensure consistent JWKS across all worker instances
 */
const STATIC_PRIVATE_JWK = {
  "kty": "RSA",
  "n": "2KBHisxoHv84FryZFQKe6mkyATt8PdafZ05L6k10d5rAgCzhWPuE9ZaVbadbzLWHAU80IHANmrRfHokyUy6VlOm9kJNn50AidOXJ4LsXTPNii4kNb9uOmSu2AzKgXBlfvCOASyd85pmmeYTZ54Vtd1YM7KB9gotYPwLuh7cJrCawMLaIxzZoLtwIEpR0Px5XpWlKC-QRTP4LHmRvC8H0RUiLuvsQzJt5cMQqATNXpAdgG10BwIwwwxReMzSsfd8eGtne703fqDL0gZ8bVFsrtnc34xyXbbQY76h6zrniULC209Q7Gb5-TcN1tbreBp22V1vQ12A5WzaROrrkTJ4o5w",
  "e": "AQAB",
  "d": "PH7WO97FnRJtGXxly8ZFlvT1r_5qveI39eOZs78ZrWUcKS9fZzgmc2cwJ8U7D7oKD8WMqxpf0jpY7fAmi7BQuZtlAwEHXT894CNj80yMP0Mg3BLUG87WzdO1KsNyoQW9BI9tfo9yg_uY0ArXx54tacwwI8zWACTl6gLpliD5pIdNwXJWBK5OOp8duaA99Vb3xp3ox_fAR4HRfMfKCfatpBp33B4mnVN8KmP13S8sCl-y0WVE782ymESTydb0PU3dnQhjSvHTIZ-nqJHz2L9OhFWCQY1aFXPCZUpqelFKx8Ya1_ifK7Im9vzUfi5S5k03igbeFKY1Pfzo9OTfcjGtEQ",
  "p": "9Iao0LcuuPu0pY-VeFqCrThHDzg-HCdU53_dZJUINJ1FTVNgif57WV4KYFuXGDDmNZ0M7gDK0OEfYYqAoiykkalH5d7aacZs9kOyCol4LnDyx9_YcjwnboPpxH2BOqTtV4D5BYRSeSVOIZij4S_quh0Ba91U-JwEDwlw6SD235M",
  "q": "4sp5tdae4IHF4wTUMBmxG2U_x6exJOk0hms7N4j7uC0Phn0BIQLbbPNO1dsj4cR8GKhxKsHttaBzbvzCDgGjW8EhntNzH6uhcJKrArYVxj_k3AJ9BhLyacijjTYsMNFglW0pDEm7GLJZskqmWEfNARsu5EUnLG8okG9BlXdWnd0",
  "dp": "v95p2FvkbYIT3VUtE6LxprniCC85jR3PoVbTgXjvV1mQZ3xk4-KrJxSDT9iOVo0IFkmFO7ujaQM8fG0RQi-FckZCBD05ZIYuOY4kxd_YTZiS6ALc88X_qtgXNfbE0B9ZnK-2tn19uVFsXTBIZwoSRLc9xkWFxw2koafm0Qbsr8E",
  "dq": "TnTdRhrJO8GpQ7AX98vriR6twdQxZCOJGDdgdQXejwiHpm74RQNIBZjmXPVCpIfkpmMfQztzkLHBPVQTjeTjLorRprBf00T8xIT4xCdZwQu5kKMLvV4wnofajK-A-iJ01zy8RpP7Nb_9Z8CLa17rfMZ6ol2J_8U0s0LJ3Xs7a8E",
  "qi": "VIltVexC2BUTsIiVpFqEkAteJQmP3jXzJuaBOsG_DEbeO34TCy6Qf4LvOXGRqmltXcWubde3Waem5QaxsTgdtdUzYLQP6SX5T8SEP2nq18Pf76jFq2wpRpab1pQRhL26o6c6rTah7X7TT7ew3SQMeqwMsfhHWANN8yL1NlqJ0Nc",
  "kid": "6a0b46ed-e602-4e33-b610-2032a2568823",
  "use": "sig",
  "alg": "RS256"
} as const

const STATIC_PUBLIC_JWK = {
  "kty": "RSA",
  "n": "2KBHisxoHv84FryZFQKe6mkyATt8PdafZ05L6k10d5rAgCzhWPuE9ZaVbadbzLWHAU80IHANmrRfHokyUy6VlOm9kJNn50AidOXJ4LsXTPNii4kNb9uOmSu2AzKgXBlfvCOASyd85pmmeYTZ54Vtd1YM7KB9gotYPwLuh7cJrCawMLaIxzZoLtwIEpR0Px5XpWlKC-QRTP4LHmRvC8H0RUiLuvsQzJt5cMQqATNXpAdgG10BwIwwwxReMzSsfd8eGtne703fqDL0gZ8bVFsrtnc34xyXbbQY76h6zrniULC209Q7Gb5-TcN1tbreBp22V1vQ12A5WzaROrrkTJ4o5w",
  "e": "AQAB",
  "kid": "6a0b46ed-e602-4e33-b610-2032a2568823",
  "use": "sig",
  "alg": "RS256"
} as const

/**
 * Load static RSA-2048 key pair for JWT signing
 * Returns the hardcoded key pair ensuring consistent JWKS across all instances
 */
export async function loadStaticKeys(): Promise<KeyPairWithId> {
  const privateKey = await importJWK(STATIC_PRIVATE_JWK, 'RS256')
  const publicKey = await importJWK(STATIC_PUBLIC_JWK, 'RS256')

  const keyPair: CryptoKeyPair = {
    privateKey,
    publicKey
  }

  return {
    keyPair,
    kid: STATIC_PRIVATE_JWK.kid,
    publicJWK: STATIC_PUBLIC_JWK as unknown as Record<string, unknown>
  }
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
    .setExpirationTime(expirationSeconds !== undefined ? `${expirationSeconds}s` : '1h')
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
