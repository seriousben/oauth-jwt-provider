import type { Config } from './config'

export function renderLandingPage(config: Config): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OAuth JWT Provider</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fafafa;
      padding: 1rem;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      padding: 1.5rem;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: #111;
    }

    .subtitle {
      color: #666;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
    }

    .info-item {
      padding: 0.625rem;
      background: #f8f8f8;
      border-radius: 3px;
      border-left: 2px solid #0066cc;
    }

    .info-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #666;
      margin-bottom: 0.2rem;
    }

    .info-value {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.75rem;
      color: #333;
      word-break: break-all;
    }

    .endpoint {
      margin-bottom: 0.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      background: #f8f8f8;
      cursor: pointer;
      user-select: none;
    }

    .endpoint-header:hover {
      background: #f0f0f0;
    }

    .method {
      font-weight: 600;
      font-size: 0.7rem;
      min-width: 38px;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      text-align: center;
    }

    .method.get {
      background: #e3f2fd;
      color: #1976d2;
    }

    .method.post {
      background: #fff3e0;
      color: #f57c00;
    }

    .path {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.8rem;
      color: #333;
      flex: 1;
    }

    .inline-description {
      display: none;
      font-size: 0.7rem;
      color: #999;
      flex: 1;
    }

    @media (min-width: 768px) {
      .inline-description {
        display: block;
      }
    }

    .expand-icon {
      font-size: 0.7rem;
      color: #999;
      transition: transform 0.2s;
    }

    .endpoint.expanded .expand-icon {
      transform: rotate(90deg);
    }

    .endpoint-body {
      display: none;
      padding: 0.75rem;
      border-top: 1px solid #e0e0e0;
      background: white;
    }

    .endpoint.expanded .endpoint-body {
      display: block;
    }

    .description {
      color: #666;
      font-size: 0.8rem;
      margin-bottom: 0.75rem;
    }

    .form-group {
      margin-bottom: 0.75rem;
    }

    label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      color: #555;
      margin-bottom: 0.25rem;
    }

    input, textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.75rem;
    }

    textarea {
      resize: vertical;
      min-height: 60px;
    }

    button {
      padding: 0.5rem 1rem;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 3px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    button:hover {
      background: #0052a3;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .response-section {
      margin-top: 0.75rem;
      display: none;
    }

    .response-section.visible {
      display: block;
    }

    .response-header {
      font-size: 0.75rem;
      font-weight: 600;
      color: #555;
      margin-bottom: 0.25rem;
      margin-top: 0.5rem;
    }

    .response-header:first-child {
      margin-top: 0;
    }

    pre {
      background: #f8f8f8;
      padding: 0.75rem;
      border-radius: 3px;
      overflow-x: auto;
      font-size: 0.7rem;
      line-height: 1.4;
      border: 1px solid #e0e0e0;
    }

    .jwt-section {
      margin-top: 0.5rem;
    }

    .jwt-parts {
      display: grid;
      gap: 0.5rem;
    }

    .jwt-part {
      background: #f8f8f8;
      padding: 0.5rem;
      border-radius: 3px;
      border: 1px solid #e0e0e0;
    }

    .jwt-part-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .jwt-part pre {
      margin: 0;
      background: white;
      padding: 0.5rem;
      font-size: 0.65rem;
    }

    .warning {
      margin: 1rem 0;
      padding: 0.625rem;
      background: #fff4e5;
      border-left: 2px solid #ff9800;
      border-radius: 3px;
      font-size: 0.8rem;
    }

    .warning-title {
      font-weight: 600;
      color: #f57c00;
      margin-bottom: 0.25rem;
      font-size: 0.8rem;
    }

    .warning-text {
      font-size: 0.75rem;
      color: #666;
    }

    .rfcs {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .rfc-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }

    .rfc-badge {
      padding: 0.2rem 0.6rem;
      background: #f0f0f0;
      border-radius: 3px;
      font-size: 0.7rem;
      color: #666;
      text-decoration: none;
      transition: background 0.2s;
    }

    .rfc-badge:hover {
      background: #e0e0e0;
    }

    footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 0.75rem;
      color: #999;
    }

    a {
      color: #0066cc;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>OAuth JWT Provider</h1>
    <p class="subtitle">RFC-compliant JWT generator for testing authorization servers</p>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Client ID</div>
        <div class="info-value">${config.clientId}</div>
      </div>
      <div class="info-item">
        <div class="info-label">JWKS URI</div>
        <div class="info-value">${config.jwksUri}</div>
      </div>
    </div>

    <!-- GET /oauth-client -->
    <div class="endpoint" data-endpoint="oauth-client">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/oauth-client</span>
        <span class="inline-description">Client ID Metadata Document</span>
        <span class="expand-icon">▶</span>
      </div>
      <div class="endpoint-body">
        <div class="description">OAuth 2.0 Client ID Metadata Document - authorization servers discover client metadata by dereferencing the client_id URL</div>
        <button onclick="callEndpoint('oauth-client')">Execute</button>
        <div class="response-section" id="response-oauth-client">
          <div class="response-header">Response:</div>
          <pre id="response-content-oauth-client"></pre>
        </div>
      </div>
    </div>

    <!-- GET /jwks -->
    <div class="endpoint" data-endpoint="jwks">
      <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="path">/jwks</span>
        <span class="inline-description">Public keys (JWKS)</span>
        <span class="expand-icon">▶</span>
      </div>
      <div class="endpoint-body">
        <div class="description">JSON Web Key Set containing public keys for JWT signature verification</div>
        <button onclick="callEndpoint('jwks')">Execute</button>
        <div class="response-section" id="response-jwks">
          <div class="response-header">Response:</div>
          <pre id="response-content-jwks"></pre>
        </div>
      </div>
    </div>

    <!-- POST /client-id-document-token -->
    <div class="endpoint" data-endpoint="client-id-document-token">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/client-id-document-token</span>
        <span class="inline-description">Client ID Metadata JWT</span>
        <span class="expand-icon">▶</span>
      </div>
      <div class="endpoint-body">
        <div class="description">Generate private_key_jwt using Client ID Metadata Document (client_id URL as iss/sub)</div>
        <div class="form-group">
          <label>Audience (aud) - optional (comma-separated for array)</label>
          <input type="text" id="aud-client-id" placeholder="https://auth-server.com/token or url1,url2">
        </div>
        <div class="form-group">
          <label>Expiration (exp) - optional (seconds, default: 3600)</label>
          <input type="number" id="exp-client-id" placeholder="3600" value="3600">
        </div>
        <button onclick="callEndpoint('client-id-document-token')">Execute</button>
        <div class="response-section" id="response-client-id-document-token">
          <div class="response-header">Request:</div>
          <pre id="request-content-client-id-document-token"></pre>
          <div class="response-header">Response:</div>
          <pre id="response-content-client-id-document-token"></pre>
          <div class="jwt-section" id="jwt-section-client-id-document-token" style="display: none;">
            <div class="response-header">JWT Decoded:</div>
            <div class="jwt-parts">
              <div class="jwt-part">
                <div class="jwt-part-label">Header</div>
                <pre id="jwt-header-client-id-document-token"></pre>
              </div>
              <div class="jwt-part">
                <div class="jwt-part-label">Payload</div>
                <pre id="jwt-payload-client-id-document-token"></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- POST /private-key-jwt-token -->
    <div class="endpoint" data-endpoint="private-key-jwt-token">
      <div class="endpoint-header">
        <span class="method post">POST</span>
        <span class="path">/private-key-jwt-token</span>
        <span class="inline-description">Standard private_key_jwt</span>
        <span class="expand-icon">▶</span>
      </div>
      <div class="endpoint-body">
        <div class="description">Generate standard private_key_jwt with custom client_id, audience, scope, and expiration</div>
        <div class="form-group">
          <label>Client ID - optional</label>
          <input type="text" id="client-id-custom" placeholder="test-client-123">
        </div>
        <div class="form-group">
          <label>Audience (aud) - optional (comma-separated for array)</label>
          <input type="text" id="aud-custom" placeholder="https://auth-server.com/token or url1,url2">
        </div>
        <div class="form-group">
          <label>Scope - optional</label>
          <input type="text" id="scope-custom" placeholder="api:read api:write">
        </div>
        <div class="form-group">
          <label>Expiration (exp) - optional (seconds, default: 3600)</label>
          <input type="number" id="exp-custom" placeholder="3600" value="3600">
        </div>
        <button onclick="callEndpoint('private-key-jwt-token')">Execute</button>
        <div class="response-section" id="response-private-key-jwt-token">
          <div class="response-header">Request:</div>
          <pre id="request-content-private-key-jwt-token"></pre>
          <div class="response-header">Response:</div>
          <pre id="response-content-private-key-jwt-token"></pre>
          <div class="jwt-section" id="jwt-section-private-key-jwt-token" style="display: none;">
            <div class="response-header">JWT Decoded:</div>
            <div class="jwt-parts">
              <div class="jwt-part">
                <div class="jwt-part-label">Header</div>
                <pre id="jwt-header-private-key-jwt-token"></pre>
              </div>
              <div class="jwt-part">
                <div class="jwt-part-label">Payload</div>
                <pre id="jwt-payload-private-key-jwt-token"></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="warning">
      <div class="warning-title">⚠️ Testing Only</div>
      <div class="warning-text">
        Ephemeral keys regenerate on cold start. Not for production use.
      </div>
    </div>

    <div class="rfcs">
      <div class="rfc-list">
        <a href="https://www.rfc-editor.org/rfc/rfc7523" class="rfc-badge" target="_blank" title="JWT Profile for OAuth 2.0 Client Authentication and Authorization Grants">RFC 7523 - JWT Profile for OAuth 2.0</a>
        <a href="https://www.rfc-editor.org/rfc/rfc7517" class="rfc-badge" target="_blank" title="JSON Web Key (JWK)">RFC 7517 - JSON Web Key (JWK)</a>
        <a href="https://www.rfc-editor.org/rfc/rfc7591" class="rfc-badge" target="_blank" title="OAuth 2.0 Dynamic Client Registration Protocol">RFC 7591 - Dynamic Client Registration</a>
        <a href="https://www.rfc-editor.org/rfc/rfc6749" class="rfc-badge" target="_blank" title="The OAuth 2.0 Authorization Framework">RFC 6749 - OAuth 2.0 Framework</a>
        <a href="https://datatracker.ietf.org/doc/draft-parecki-oauth-client-id-metadata-document/" class="rfc-badge" target="_blank" title="OAuth 2.0 Client ID Metadata Document">Draft - Client ID Metadata Document</a>
      </div>
    </div>

    <footer>
      <a href="https://github.com/seriousben/oauth-jwt-provider" target="_blank">GitHub</a>
    </footer>
  </div>

  <script>
    // Toggle endpoint expansion
    document.querySelectorAll('.endpoint-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('expanded');
      });
    });

    async function callEndpoint(endpoint) {
      const responseSection = document.getElementById(\`response-\${endpoint}\`);
      const responseContent = document.getElementById(\`response-content-\${endpoint}\`);
      const requestContent = document.getElementById(\`request-content-\${endpoint}\`);

      responseSection.classList.add('visible');
      responseContent.textContent = 'Loading...';

      try {
        let url = \`/\${endpoint}\`;
        let options = { method: 'GET' };
        let requestBody = null;

        if (endpoint === 'client-id-document-token') {
          options.method = 'POST';
          options.headers = { 'Content-Type': 'application/json' };

          requestBody = {};
          const audInput = document.getElementById('aud-client-id').value;
          const expInput = document.getElementById('exp-client-id').value;

          if (audInput) {
            // Parse comma-separated values as array, single value as string
            if (audInput.includes(',')) {
              requestBody.aud = audInput.split(',').map(s => s.trim()).filter(s => s);
            } else {
              requestBody.aud = audInput;
            }
          }
          if (expInput) {
            requestBody.exp = parseInt(expInput, 10);
          }

          if (Object.keys(requestBody).length > 0) {
            options.body = JSON.stringify(requestBody);
          }
        } else if (endpoint === 'private-key-jwt-token') {
          options.method = 'POST';
          options.headers = { 'Content-Type': 'application/json' };

          requestBody = {};
          const clientId = document.getElementById('client-id-custom').value;
          const audInput = document.getElementById('aud-custom').value;
          const scope = document.getElementById('scope-custom').value;
          const expInput = document.getElementById('exp-custom').value;

          if (clientId) requestBody.client_id = clientId;
          if (audInput) {
            // Parse comma-separated values as array, single value as string
            if (audInput.includes(',')) {
              requestBody.aud = audInput.split(',').map(s => s.trim()).filter(s => s);
            } else {
              requestBody.aud = audInput;
            }
          }
          if (scope) requestBody.scope = scope;
          if (expInput) {
            requestBody.exp = parseInt(expInput, 10);
          }

          if (Object.keys(requestBody).length > 0) {
            options.body = JSON.stringify(requestBody);
          }
        }

        if (requestContent && requestBody) {
          requestContent.textContent = JSON.stringify(requestBody, null, 2);
        }

        const response = await fetch(url, options);
        const data = await response.json();
        responseContent.textContent = JSON.stringify(data, null, 2);

        // Decode JWT for POST endpoints
        if ((endpoint === 'client-id-document-token' || endpoint === 'private-key-jwt-token') && data.access_token) {
          decodeAndDisplayJWT(data.access_token, endpoint);
        }
      } catch (error) {
        responseContent.textContent = \`Error: \${error.message}\`;
      }
    }

    function decodeAndDisplayJWT(jwt, endpoint) {
      try {
        const parts = jwt.split('.');
        if (parts.length !== 3) {
          return;
        }

        // Decode header and payload
        const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

        // Display decoded JWT
        document.getElementById(\`jwt-section-\${endpoint}\`).style.display = 'block';
        document.getElementById(\`jwt-header-\${endpoint}\`).textContent = JSON.stringify(header, null, 2);
        document.getElementById(\`jwt-payload-\${endpoint}\`).textContent = JSON.stringify(payload, null, 2);
      } catch (error) {
        console.error('Failed to decode JWT:', error);
      }
    }
  </script>
</body>
</html>`
}
