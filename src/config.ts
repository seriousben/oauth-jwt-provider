export interface Config {
  publicUrl: string
  clientId: string
  jwksUri: string
  audiences: string[]
  clientName: string
  scope: string
  tokenTtl: number
  redirectUris?: string[]
  grantTypes: string[]
}

export interface Env {
  JWT_AUDIENCE?: string
  DEFAULT_REDIRECT_URIS?: string
  DEFAULT_GRANT_TYPES?: string
}

export interface ClientMetadataOverrides {
  redirect_uris?: string[]
  scope?: string
  client_name?: string
  grant_types?: string[]
}

// Base64url decode helper
function base64urlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '='
  }
  // Decode base64
  const decoded = atob(base64)
  return decoded
}

export function getConfig(env: Env, request: Request): Config {
  // Always infer public URL from request hostname
  const url = new URL(request.url)
  const publicUrl = `${url.protocol}//${url.host}`

  // Parse defaults from environment
  const defaultRedirectUris = env.DEFAULT_REDIRECT_URIS
    ? env.DEFAULT_REDIRECT_URIS.split(',')
    : ['http://localhost:8080/callback']

  const defaultGrantTypes = env.DEFAULT_GRANT_TYPES
    ? env.DEFAULT_GRANT_TYPES.split(',')
    : ['authorization_code', 'refresh_token', 'client_credentials']

  // Check if path contains base64url-encoded overrides
  // Pattern: /oauth-client/{base64url}
  const pathMatch = url.pathname.match(/^\/oauth-client\/([A-Za-z0-9_-]+)$/)
  let overrides: ClientMetadataOverrides = {}
  let clientIdPath = '/oauth-client'

  if (pathMatch) {
    try {
      const decoded = base64urlDecode(pathMatch[1])
      overrides = JSON.parse(decoded)
      clientIdPath = `/oauth-client/${pathMatch[1]}`
    } catch (error) {
      // Invalid base64 or JSON - ignore and use defaults
      console.error('Failed to parse client metadata overrides:', error)
    }
  }

  return {
    publicUrl,
    clientId: `${publicUrl}${clientIdPath}`,
    jwksUri: `${publicUrl}/jwks`,
    audiences: env.JWT_AUDIENCE ? env.JWT_AUDIENCE.split(',') : [],
    clientName: overrides.client_name || 'OAuth JWT Provider',
    scope: overrides.scope || 'read write',
    tokenTtl: 3600,
    redirectUris: overrides.redirect_uris || defaultRedirectUris,
    grantTypes: overrides.grant_types || defaultGrantTypes
  }
}
