import { getConfig, type Env } from './config'

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

function handleOAuthClient(config: ReturnType<typeof getConfig>, request: Request): Response {
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
  // Placeholder - will be implemented in Phase 2
  return jsonResponse({
    keys: [
      {
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid: 'placeholder',
        n: 'placeholder',
        e: 'AQAB'
      }
    ]
  }, 200, request)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const config = getConfig(env)
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: getCorsHeaders(request)
      })
    }

    // Route handlers
    if (url.pathname === '/health') {
      return handleHealth(request)
    }

    if (url.pathname === '/oauth-client') {
      return handleOAuthClient(config, request)
    }

    if (url.pathname === '/jwks') {
      return handleJWKS(request)
    }

    // 404 for unknown routes
    return jsonResponse({
      error: 'not_found',
      error_description: 'Endpoint not found'
    }, 404, request)
  }
}
