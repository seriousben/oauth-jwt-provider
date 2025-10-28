import { getConfig, type Env, type Config } from './config'
import { createKeyPair, signJWT, type KeyPairWithId } from './crypto'
import { renderLandingPage } from './ui'

// Global state (regenerates on cold start)
let keys: KeyPairWithId | null = null

async function initialize() {
  if (!keys) {
    keys = await createKeyPair()
  }
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || 'http://127.0.0.1:8787'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

function jsonResponse(body: unknown, status: number, request: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request)
    }
  })
}

function handleHealth(request: Request): Response {
  return jsonResponse({
    status: 'healthy',
    service: 'oauth-jwt-provider'
  }, 200, request)
}

function handleOAuthClient(config: Config, request: Request): Response {
  return jsonResponse({
    client_id: config.clientId,
    client_name: config.clientName,
    grant_types: ['client_credentials'],
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: 'RS256',
    jwks_uri: config.jwksUri,
    scope: config.scope
  }, 200, request)
}

function handleJWKS(request: Request): Response {
  if (!keys) {
    return jsonResponse({ error: 'keys_not_initialized' }, 500, request)
  }

  return jsonResponse({
    keys: [keys.publicJWK]
  }, 200, request)
}

async function handleClientIdDocumentToken(
  config: Config,
  request: Request
): Promise<Response> {
  if (!keys) {
    return jsonResponse({ error: 'keys_not_initialized' }, 500, request)
  }

  try {
    // Parse optional request body for audience override
    let requestBody: { aud?: string | string[], exp?: number } = {}
    if (request.headers.get('Content-Type')?.includes('application/json')) {
      try {
        requestBody = await request.json() as any
      } catch {
        // Ignore JSON parse errors, use defaults
      }
    }

    // Build audience: use request aud, or config audiences, or empty array
    let aud: string | string[] | undefined
    if (requestBody.aud) {
      aud = requestBody.aud
    } else if (config.audiences.length > 0) {
      aud = config.audiences
    }

    const payload: Record<string, unknown> = {
      iss: config.clientId,
      sub: config.clientId
    }

    if (aud) {
      payload.aud = aud
    }

    const expirationSeconds = requestBody.exp || config.tokenTtl
    const jwt = await signJWT(payload, keys.keyPair.privateKey, keys.kid, expirationSeconds)

    return jsonResponse({
      access_token: jwt,
      token_type: 'Bearer',
      expires_in: expirationSeconds,
      scope: config.scope
    }, 200, request)
  } catch (error) {
    return jsonResponse({
      error: 'server_error',
      error_description: String(error)
    }, 500, request)
  }
}

async function handlePrivateKeyJwtToken(
  config: Config,
  request: Request
): Promise<Response> {
  if (!keys) {
    return jsonResponse({ error: 'keys_not_initialized' }, 500, request)
  }

  try {
    // Parse request body for custom claims
    let requestBody: {
      client_id?: string
      scope?: string
      aud?: string | string[]
      exp?: number
    } = {}

    if (request.headers.get('Content-Type')?.includes('application/json')) {
      try {
        requestBody = await request.json() as any
      } catch {
        // Ignore JSON parse errors, use defaults
      }
    }

    // Use custom client_id or default to config
    const clientId = requestBody.client_id || config.clientId
    const scope = requestBody.scope || config.scope

    // Build audience
    let aud: string | string[] | undefined
    if (requestBody.aud) {
      aud = requestBody.aud
    } else if (config.audiences.length > 0) {
      aud = config.audiences
    }

    const payload: Record<string, unknown> = {
      iss: clientId,
      sub: clientId
    }

    if (aud) {
      payload.aud = aud
    }

    if (scope) {
      payload.scope = scope
    }

    const expirationSeconds = requestBody.exp || config.tokenTtl
    const jwt = await signJWT(payload, keys.keyPair.privateKey, keys.kid, expirationSeconds)

    return jsonResponse({
      access_token: jwt,
      token_type: 'Bearer',
      expires_in: expirationSeconds,
      scope
    }, 200, request)
  } catch (error) {
    return jsonResponse({
      error: 'server_error',
      error_description: String(error)
    }, 500, request)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    await initialize()

    const config = getConfig(env, request)
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: getCorsHeaders(request)
      })
    }

    // Route handlers
    if (url.pathname === '/') {
      return new Response(renderLandingPage(config), {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          ...getCorsHeaders(request)
        }
      })
    }

    if (url.pathname === '/health') {
      return handleHealth(request)
    }

    if (url.pathname === '/oauth-client') {
      return handleOAuthClient(config, request)
    }

    if (url.pathname === '/jwks') {
      return handleJWKS(request)
    }

    if (url.pathname === '/client-id-document-token' && request.method === 'POST') {
      return await handleClientIdDocumentToken(config, request)
    }

    if (url.pathname === '/private-key-jwt-token' && request.method === 'POST') {
      return await handlePrivateKeyJwtToken(config, request)
    }

    // 404 for unknown routes
    return jsonResponse({
      error: 'not_found',
      error_description: 'Endpoint not found'
    }, 404, request)
  }
}
