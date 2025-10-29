# oauth-jwt-provider

RFC-compliant OAuth 2.0 JWT generator for testing authorization servers. Runs on Cloudflare Workers.

## Purpose

Generate RFC-compliant test JWTs for:
- CI pipeline testing
- Local development
- Integration testing of authorization servers
- OAuth Client ID Metadata Document testing

## Features

- ✅ RFC 7523 compliant JWT generation (private_key_jwt)
- ✅ RFC 7517 compliant JWKS endpoint
- ✅ RFC 7591 compliant OAuth client metadata
- ✅ OAuth Client ID Metadata Document support
- ✅ Dynamic redirect_uris and metadata via base64url-encoded client_id URLs
- ✅ Support for authorization_code, refresh_token, and client_credentials flows
- ✅ TypeScript
- ✅ Zero production dependencies (uses `jose` for development)
- ✅ Comprehensive test suite with Vitest

## Endpoints

```
GET  /                            - Interactive UI for testing
GET  /health                      - Service health check
GET  /oauth-client                - OAuth client metadata (RFC 7591)
GET  /oauth-client/{base64url}    - OAuth client metadata with custom overrides
GET  /jwks                        - JSON Web Key Set (RFC 7517)
POST /client-id-document-token    - Generate JWT using client_id URL
POST /private-key-jwt-token       - Generate JWT with custom claims
```

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

The dev server will start at `http://127.0.0.1:8787`

### Testing

Tests use `@cloudflare/vitest-pool-workers` and run directly in the Workers runtime:

```bash
npm test
```

Tests verify RFC compliance:
- RFC 7591: OAuth client metadata structure
- RFC 7517: JWKS document format
- RFC 7523: JWT claims and structure
- CORS behavior
- Client ID Metadata Document integration

## Deployment

### Deploy to Cloudflare Workers

1. **Get Cloudflare API Token**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to: My Profile > API Tokens
   - Click "Create Token"
   - Use template: "Edit Cloudflare Workers"
   - Copy the token

2. **Configure GitHub Secrets**
   - Go to your GitHub repository settings
   - Navigate to: Settings > Secrets and variables > Actions
   - Add secret: `CLOUDFLARE_API_TOKEN` with your API token

3. **Deploy**

   The GitHub Actions workflow will automatically deploy on push to `main`:

   ```yaml
   # .github/workflows/ci.yml runs:
   # 1. Tests on all pushes and PRs
   # 2. Deploys to Cloudflare Workers on push to main
   ```

4. **Manual Deploy**

   ```bash
   npm run deploy
   ```

### Environment Variables

Configure in `wrangler.toml`:

- `JWT_AUDIENCE` - Comma-separated audience values (optional)
- `DEFAULT_REDIRECT_URIS` - Comma-separated redirect URIs (optional, default: `http://localhost:8080/callback`)
- `DEFAULT_GRANT_TYPES` - Comma-separated grant types (optional, default: `authorization_code,refresh_token,client_credentials`)

The worker automatically infers its public URL from the incoming request hostname, so no configuration is needed for different deployment environments.

Example configuration:

```toml
[vars]
JWT_AUDIENCE = "https://auth-server.com/token"
DEFAULT_REDIRECT_URIS = "https://myapp.com/callback,http://localhost:3000/auth/callback"
DEFAULT_GRANT_TYPES = "authorization_code,refresh_token"
```

## Usage Examples

### Dynamic Client Metadata

Configure client metadata without redeployment. The API handles base64url encoding automatically.

**UI:**
1. Navigate to `/`
2. Configure redirect URIs, scope, grant types in "Client ID Document Token" section
3. Click "Generate Token" - returns custom client_id URL and JWT

**API:**
```bash
curl -X POST https://your-worker.dev/client-id-document-token \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "redirect_uris": ["https://myapp.com/callback"],
      "grant_types": ["authorization_code", "refresh_token"],
      "scope": "read write"
    },
    "aud": "https://auth-server.com/token"
  }'
```

Response includes custom client_id URL in JWT `iss`/`sub` claims.

**Metadata Fields:**
- `redirect_uris` - Array of redirect URIs
- `grant_types` - Array of grant types
- `scope` - Space-separated scope values
- `client_name` - Display name

### Generate JWT for CI Testing

```bash
# Generate JWT for authorization server testing
CLIENT_ASSERTION=$(curl -s -X POST https://oauth-jwt-provider.example.workers.dev/client-id-document-token \
  -H "Content-Type: application/json" \
  -d '{"aud": "https://auth-server.com/token"}' \
  | jq -r .access_token)

# Use JWT to test authorization server
curl -X POST https://auth-server.com/token \
  -d "grant_type=client_credentials" \
  -d "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  -d "client_assertion=$CLIENT_ASSERTION"
```

### Custom Client ID

```bash
curl -X POST https://oauth-jwt-provider.example.workers.dev/private-key-jwt-token \
  -H "Content-Type: application/json" \
  -d '{"client_id": "test-client", "aud": "https://auth-server.com/token"}' \
  | jq -r .access_token
```

### Test Client ID Metadata Discovery

```bash
# 1. Authorization server discovers client metadata
curl https://oauth-jwt-provider.example.workers.dev/oauth-client

# 2. Authorization server retrieves public keys
curl https://oauth-jwt-provider.example.workers.dev/jwks

# 3. Generate JWT for token request
CLIENT_ASSERTION=$(curl -s -X POST https://oauth-jwt-provider.example.workers.dev/client-id-document-token \
  -H "Content-Type: application/json" \
  -d '{"aud": "https://auth-server.com/token"}' \
  | jq -r .access_token)

# 4. Test authorization server token endpoint
curl -X POST https://auth-server.com/token \
  -d "grant_type=client_credentials" \
  -d "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  -d "client_assertion=$CLIENT_ASSERTION"
```

## Configuration

### Automatic URL Detection

The service automatically infers its public URL from the incoming request hostname. This means:
- **No configuration needed** for deployment
- Works on `localhost`, `*.workers.dev`, and custom domains automatically
- `client_id` and `jwks_uri` adapt to the actual hostname

### CORS

The service returns the incoming `Origin` header in `Access-Control-Allow-Origin`. If no `Origin` header is present, it defaults to `http://127.0.0.1:8787`.

This allows the service to be used from any origin in CI/testing environments.

## Security Considerations

**⚠️ FOR TESTING ONLY ⚠️**

This service is designed for testing authorization servers and is **NOT secure for production**:

- Ephemeral keys regenerate on cold start (no persistence)
- No key rotation mechanisms
- No rate limiting
- CORS allows all origins
- Public keys are visible via /jwks endpoint (by design)

**Intended Use**: Testing authorization servers in CI/CD pipelines and local development.

## Project Structure

```
oauth-jwt-provider/
├── src/
│   ├── index.ts       # Main worker entry point
│   └── config.ts      # Configuration
├── test/
│   └── index.test.ts  # RFC compliance tests
├── .github/
│   └── workflows/
│       └── ci.yml     # GitHub Actions CI/CD
├── package.json
├── wrangler.toml      # Cloudflare Workers config
├── vitest.config.ts   # Vitest configuration
└── tsconfig.json      # TypeScript config
```

## References

### RFCs
- [RFC 6749 - OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)
- [RFC 7517 - JSON Web Key (JWK)](https://www.rfc-editor.org/rfc/rfc7517)
- [RFC 7519 - JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519)
- [RFC 7523 - JWT Profile for OAuth 2.0 Client Authentication](https://www.rfc-editor.org/rfc/rfc7523)
- [RFC 7591 - OAuth 2.0 Dynamic Client Registration](https://www.rfc-editor.org/rfc/rfc7591)

### Specifications
- [OAuth Client ID Metadata Document Draft](https://github.com/aaronpk/draft-parecki-oauth-client-id-metadata-document)

### Tools
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [jose - JavaScript JWT library](https://github.com/panva/jose)

## License

Apache-2.0

## Contributing

Issues and pull requests welcome!
