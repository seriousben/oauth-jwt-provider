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
  JWT_AUDIENCE?: string
}

export function getConfig(env: Env, request: Request): Config {
  // Always infer public URL from request hostname
  const url = new URL(request.url)
  const publicUrl = `${url.protocol}//${url.host}`

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
