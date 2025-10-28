export interface Config {
  publicUrl: string
  clientId: string
  jwksUri: string
  audiences: string[]
  clientName: string
  scope: string
  tokenTtl: number
}

export interface Env {
  PUBLIC_URL?: string
  JWT_AUDIENCE?: string
}

export function getConfig(env: Env): Config {
  const publicUrl = env.PUBLIC_URL || 'http://127.0.0.1:8787'

  return {
    publicUrl,
    clientId: `${publicUrl}/oauth-client`,
    jwksUri: `${publicUrl}/jwks`,
    audiences: env.JWT_AUDIENCE ? env.JWT_AUDIENCE.split(',') : [],
    clientName: 'OAuth JWT Provider',
    scope: 'read write',
    tokenTtl: 3600
  }
}
