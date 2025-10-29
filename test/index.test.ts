// RFC Compliance Test Suite
// Tests RFC 7523, RFC 7517, RFC 7591 compliance

import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";
import { jwtVerify, importJWK } from "jose";

describe("RFC 7591 - OAuth Client Metadata", () => {
  it("has required fields", async () => {
    const response = await SELF.fetch("http://example.com/oauth-client");
    expect(response.ok).toBe(true);

    const metadata = await response.json() as any;
    expect(metadata.client_id).toBeDefined();
    expect(metadata.grant_types).toBeDefined();
    expect(metadata.token_endpoint_auth_method).toBeDefined();
  });

  it("uses private_key_jwt auth method", async () => {
    const response = await SELF.fetch("http://example.com/oauth-client");
    const metadata = await response.json() as any;

    expect(metadata.token_endpoint_auth_method).toBe("private_key_jwt");
    expect(metadata.token_endpoint_auth_signing_alg).toBe("RS256");
  });

  it("includes jwks_uri", async () => {
    const response = await SELF.fetch("http://example.com/oauth-client");
    const metadata = await response.json() as any;

    expect(metadata.jwks_uri).toBeDefined();
    expect(metadata.jwks_uri).toMatch(/^http/);
  });

  it("includes client_credentials grant type", async () => {
    const response = await SELF.fetch("http://example.com/oauth-client");
    const metadata = await response.json() as any;

    expect(metadata.grant_types).toContain("client_credentials");
  });
});

describe("RFC 7517 - JWKS", () => {
  it("has keys array", async () => {
    const response = await SELF.fetch("http://example.com/jwks");
    expect(response.ok).toBe(true);

    const jwks = await response.json() as any;
    expect(Array.isArray(jwks.keys)).toBe(true);
    expect(jwks.keys.length).toBeGreaterThan(0);
  });

  it("JWK has required RSA fields", async () => {
    const response = await SELF.fetch("http://example.com/jwks");
    const jwks = await response.json() as any;
    const key = jwks.keys[0];

    expect(key.kty).toBe("RSA");
    expect(key.n).toBeDefined();
    expect(key.e).toBeDefined();
  });

  it("JWK has recommended fields", async () => {
    const response = await SELF.fetch("http://example.com/jwks");
    const jwks = await response.json() as any;
    const key = jwks.keys[0];

    expect(key.kid).toBeDefined();
    expect(key.alg).toBe("RS256");
    expect(key.use).toBe("sig");
  });
});

describe("CORS", () => {
  it("returns incoming Origin header", async () => {
    const response = await SELF.fetch("http://example.com/health", {
      headers: { Origin: "https://example.com" }
    });

    const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
    expect(allowOrigin).toBe("https://example.com");
  });

  it("handles OPTIONS preflight", async () => {
    const response = await SELF.fetch("http://example.com/health", {
      method: "OPTIONS",
      headers: { Origin: "https://test.com" }
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBeDefined();
  });

  it("returns default origin when no Origin header", async () => {
    const response = await SELF.fetch("http://example.com/health");

    const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
    expect(allowOrigin).toBe("http://127.0.0.1:8787");
  });
});

describe("Health Check", () => {
  it("returns healthy status", async () => {
    const response = await SELF.fetch("http://example.com/health");
    expect(response.ok).toBe(true);

    const health = await response.json() as any;
    expect(health.status).toBe("healthy");
    expect(health.service).toBe("oauth-jwt-provider");
  });

  it("returns JSON content type", async () => {
    const response = await SELF.fetch("http://example.com/health");
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});

describe("UI Landing Page", () => {
  it("serves HTML at root path", async () => {
    const response = await SELF.fetch("http://example.com/");
    expect(response.ok).toBe(true);
    expect(response.headers.get("Content-Type")).toBe("text/html");
  });

  it("contains client_id and jwks_uri in page", async () => {
    const response = await SELF.fetch("http://example.com/");
    const html = await response.text();

    expect(html).toContain("http://example.com/oauth-client");
    expect(html).toContain("http://example.com/jwks");
  });

  it("has CORS headers", async () => {
    const response = await SELF.fetch("http://example.com/", {
      headers: { Origin: "https://test.com" }
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://test.com");
  });
});

describe("Client ID Metadata Document Integration", () => {
  it("client_id is a URL", async () => {
    const response = await SELF.fetch("http://example.com/oauth-client");
    const metadata = await response.json() as any;

    expect(metadata.client_id).toMatch(/^http/);
  });

  it("client_id URL serves metadata document", async () => {
    const metadataResponse = await SELF.fetch("http://example.com/oauth-client");
    const metadata = await metadataResponse.json() as any;
    const clientId = metadata.client_id;

    // Verify client_id URL serves metadata
    const clientIdResponse = await SELF.fetch(clientId);
    expect(clientIdResponse.ok).toBe(true);

    const clientIdMetadata = await clientIdResponse.json() as any;
    expect(clientIdMetadata.client_id).toBe(clientId);
  });
});

describe("Error Handling", () => {
  it("returns 404 for unknown routes", async () => {
    const response = await SELF.fetch("http://example.com/unknown");
    expect(response.status).toBe(404);

    const error = await response.json() as any;
    expect(error.error).toBe("not_found");
  });

  it("404 response has CORS headers", async () => {
    const response = await SELF.fetch("http://example.com/unknown", {
      headers: { Origin: "https://test.com" }
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://test.com");
  });
});

describe("OAuth Client Metadata with redirect_uris", () => {
  it("default client includes redirect_uris", async () => {
    const response = await SELF.fetch("http://example.com/oauth-client");
    const metadata = await response.json() as any;

    expect(metadata.redirect_uris).toBeDefined();
    expect(Array.isArray(metadata.redirect_uris)).toBe(true);
    expect(metadata.redirect_uris).toContain("http://localhost:8080/callback");
  });

  it("default client includes multiple grant types", async () => {
    const response = await SELF.fetch("http://example.com/oauth-client");
    const metadata = await response.json() as any;

    expect(metadata.grant_types).toContain("authorization_code");
    expect(metadata.grant_types).toContain("refresh_token");
    expect(metadata.grant_types).toContain("client_credentials");
  });

  // Helper to base64url encode
  function base64urlEncode(str: string): string {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  it("accepts base64url-encoded custom redirect_uris", async () => {
    const metadata = {
      redirect_uris: ["https://myapp.com/callback", "https://localhost:3000/auth/callback"]
    };
    const encoded = base64urlEncode(JSON.stringify(metadata));

    const response = await SELF.fetch(`http://example.com/oauth-client/${encoded}`);
    expect(response.ok).toBe(true);

    const returnedMetadata = await response.json() as any;
    expect(returnedMetadata.redirect_uris).toEqual(metadata.redirect_uris);
  });

  it("accepts base64url-encoded custom grant_types", async () => {
    const metadata = {
      grant_types: ["authorization_code", "refresh_token"]
    };
    const encoded = base64urlEncode(JSON.stringify(metadata));

    const response = await SELF.fetch(`http://example.com/oauth-client/${encoded}`);
    expect(response.ok).toBe(true);

    const returnedMetadata = await response.json() as any;
    expect(returnedMetadata.grant_types).toEqual(metadata.grant_types);
  });

  it("accepts base64url-encoded custom scope", async () => {
    const metadata = {
      scope: "api:read api:write profile"
    };
    const encoded = base64urlEncode(JSON.stringify(metadata));

    const response = await SELF.fetch(`http://example.com/oauth-client/${encoded}`);
    expect(response.ok).toBe(true);

    const returnedMetadata = await response.json() as any;
    expect(returnedMetadata.scope).toBe(metadata.scope);
  });

  it("accepts base64url-encoded custom client_name", async () => {
    const metadata = {
      client_name: "My Custom Test Application"
    };
    const encoded = base64urlEncode(JSON.stringify(metadata));

    const response = await SELF.fetch(`http://example.com/oauth-client/${encoded}`);
    expect(response.ok).toBe(true);

    const returnedMetadata = await response.json() as any;
    expect(returnedMetadata.client_name).toBe(metadata.client_name);
  });

  it("accepts base64url-encoded multiple overrides combined", async () => {
    const metadata = {
      redirect_uris: ["https://app.example.com/oauth/callback"],
      grant_types: ["authorization_code"],
      scope: "openid profile email",
      client_name: "Production App"
    };
    const encoded = base64urlEncode(JSON.stringify(metadata));

    const response = await SELF.fetch(`http://example.com/oauth-client/${encoded}`);
    expect(response.ok).toBe(true);

    const returnedMetadata = await response.json() as any;
    expect(returnedMetadata.redirect_uris).toEqual(metadata.redirect_uris);
    expect(returnedMetadata.grant_types).toEqual(metadata.grant_types);
    expect(returnedMetadata.scope).toBe(metadata.scope);
    expect(returnedMetadata.client_name).toBe(metadata.client_name);
  });

  it("custom client_id URL includes base64url path", async () => {
    const metadata = {
      redirect_uris: ["https://myapp.com/callback"]
    };
    const encoded = base64urlEncode(JSON.stringify(metadata));

    const response = await SELF.fetch(`http://example.com/oauth-client/${encoded}`);
    const returnedMetadata = await response.json() as any;

    expect(returnedMetadata.client_id).toBe(`http://example.com/oauth-client/${encoded}`);
  });

  it("handles invalid base64url gracefully", async () => {
    const response = await SELF.fetch("http://example.com/oauth-client/invalid!!!base64");
    expect(response.ok).toBe(true);

    const metadata = await response.json() as any;
    // Should fall back to defaults
    expect(metadata.redirect_uris).toContain("http://localhost:8080/callback");
    expect(metadata.grant_types).toContain("client_credentials");
  });

  it("handles invalid JSON in base64url gracefully", async () => {
    const invalidJson = base64urlEncode("{invalid json");

    const response = await SELF.fetch(`http://example.com/oauth-client/${invalidJson}`);
    expect(response.ok).toBe(true);

    const metadata = await response.json() as any;
    // Should fall back to defaults
    expect(metadata.redirect_uris).toContain("http://localhost:8080/callback");
  });

  it("preserves standard OAuth metadata fields", async () => {
    const metadata = {
      redirect_uris: ["https://custom.com/callback"]
    };
    const encoded = base64urlEncode(JSON.stringify(metadata));

    const response = await SELF.fetch(`http://example.com/oauth-client/${encoded}`);
    const returnedMetadata = await response.json() as any;

    // Standard fields should still be present
    expect(returnedMetadata.token_endpoint_auth_method).toBe("private_key_jwt");
    expect(returnedMetadata.token_endpoint_auth_signing_alg).toBe("RS256");
    expect(returnedMetadata.jwks_uri).toBeDefined();
  });
});

describe("RFC 7523 - JWT Generation", () => {
  // Helper to decode JWT payload
  function decodeJWTPayload(jwt: string): any {
    const parts = jwt.split('.');
    expect(parts.length).toBe(3);

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  // Helper to decode JWT header
  function decodeJWTHeader(jwt: string): any {
    const parts = jwt.split('.');
    const header = parts[0];
    const decoded = atob(header.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  describe("Client ID Document Token", () => {
    it("returns token response with required fields", async () => {
      const response = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      expect(response.ok).toBe(true);
      const tokenResponse = await response.json() as any;

      expect(tokenResponse.access_token).toBeDefined();
      expect(tokenResponse.token_type).toBe("Bearer");
      expect(tokenResponse.expires_in).toBe(3600);
      expect(tokenResponse.scope).toBeDefined();
      expect(tokenResponse.client_id).toBeDefined();
      expect(tokenResponse.client_id).toMatch(/^http/);
    });

    it("JWT has RS256 algorithm in header", async () => {
      const response = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const tokenResponse = await response.json() as any;
      const header = decodeJWTHeader(tokenResponse.access_token);

      expect(header.alg).toBe("RS256");
      expect(header.typ).toBe("JWT");
      expect(header.kid).toBeDefined();
    });

    it("JWT has required RFC 7523 claims", async () => {
      const response = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const tokenResponse = await response.json() as any;
      const payload = decodeJWTPayload(tokenResponse.access_token);

      // Required claims
      expect(payload.iss).toBeDefined();
      expect(payload.sub).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
      expect(payload.jti).toBeDefined();
    });

    it("JWT has iss = sub = client_id", async () => {
      const metadataResponse = await SELF.fetch("http://example.com/oauth-client");
      const metadata = await metadataResponse.json() as any;

      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const payload = decodeJWTPayload(token.access_token);

      expect(payload.iss).toBe(metadata.client_id);
      expect(payload.sub).toBe(metadata.client_id);
    });

    it("JWT exp > iat", async () => {
      const response = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const tokenResponse = await response.json() as any;
      const payload = decodeJWTPayload(tokenResponse.access_token);

      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it("jti is unique across requests", async () => {
      const response1 = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });
      const response2 = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token1 = await response1.json() as any;
      const token2 = await response2.json() as any;

      const payload1 = decodeJWTPayload(token1.access_token);
      const payload2 = decodeJWTPayload(token2.access_token);

      expect(payload1.jti).not.toBe(payload2.jti);
    });

    it("accepts custom audience in request", async () => {
      const customAud = "https://auth-server.example.com/token";
      const response = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aud: customAud })
      });

      const tokenResponse = await response.json() as any;
      const payload = decodeJWTPayload(tokenResponse.access_token);

      expect(payload.aud).toBe(customAud);
    });

    it("accepts custom metadata in request", async () => {
      const metadata = {
        redirect_uris: ["https://custom-app.com/callback"],
        scope: "custom:scope",
        client_name: "Custom Test Client"
      };

      const response = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata })
      });

      expect(response.ok).toBe(true);
      const tokenResponse = await response.json() as any;
      expect(tokenResponse.access_token).toBeDefined();
      expect(tokenResponse.client_id).toBeDefined();

      const payload = decodeJWTPayload(tokenResponse.access_token);

      // JWT iss/sub should match returned client_id
      expect(payload.iss).toBe(tokenResponse.client_id);
      expect(payload.sub).toBe(tokenResponse.client_id);
      expect(tokenResponse.client_id).toContain("/oauth-client/");

      // Scope should match custom metadata
      expect(tokenResponse.scope).toBe(metadata.scope);
    });

    it("uses custom metadata with custom audience", async () => {
      const metadata = {
        redirect_uris: ["https://test.com/cb"],
        scope: "read write admin"
      };
      const customAud = "https://auth.example.com/token";

      const response = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata,
          aud: customAud
        })
      });

      const tokenResponse = await response.json() as any;
      const payload = decodeJWTPayload(tokenResponse.access_token);

      // Both custom client_id and aud should be present
      expect(payload.iss).toContain("/oauth-client/");
      expect(payload.aud).toBe(customAud);
      expect(tokenResponse.scope).toBe(metadata.scope);
    });
  });

  describe("Private Key JWT Token", () => {
    it("returns token response with required fields", async () => {
      const response = await SELF.fetch("http://example.com/private-key-jwt-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      expect(response.ok).toBe(true);
      const tokenResponse = await response.json() as any;

      expect(tokenResponse.access_token).toBeDefined();
      expect(tokenResponse.token_type).toBe("Bearer");
      expect(tokenResponse.expires_in).toBe(3600);
      expect(tokenResponse.scope).toBeDefined();
    });

    it("accepts custom client_id", async () => {
      const customClientId = "test-client-123";
      const response = await SELF.fetch("http://example.com/private-key-jwt-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: customClientId })
      });

      const tokenResponse = await response.json() as any;
      const payload = decodeJWTPayload(tokenResponse.access_token);

      expect(payload.iss).toBe(customClientId);
      expect(payload.sub).toBe(customClientId);
    });

    it("accepts custom scope", async () => {
      const customScope = "api:read api:write";
      const response = await SELF.fetch("http://example.com/private-key-jwt-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: customScope })
      });

      const tokenResponse = await response.json() as any;
      const payload = decodeJWTPayload(tokenResponse.access_token);

      expect(payload.scope).toBe(customScope);
      expect(tokenResponse.scope).toBe(customScope);
    });

    it("accepts custom audience", async () => {
      const customAud = ["https://api1.example.com", "https://api2.example.com"];
      const response = await SELF.fetch("http://example.com/private-key-jwt-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aud: customAud })
      });

      const tokenResponse = await response.json() as any;
      const payload = decodeJWTPayload(tokenResponse.access_token);

      expect(payload.aud).toEqual(customAud);
    });

    it("uses defaults when no custom values provided", async () => {
      const metadataResponse = await SELF.fetch("http://example.com/oauth-client");
      const metadata = await metadataResponse.json() as any;

      const tokenResponse = await SELF.fetch("http://example.com/private-key-jwt-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const payload = decodeJWTPayload(token.access_token);

      expect(payload.iss).toBe(metadata.client_id);
      expect(payload.sub).toBe(metadata.client_id);
      expect(payload.scope).toBe(metadata.scope);
    });
  });

  describe("JWKS and JWT kid Matching", () => {
    it("JWT kid matches JWKS kid", async () => {
      const jwksResponse = await SELF.fetch("http://example.com/jwks");
      const jwks = await jwksResponse.json() as any;
      const jwkKid = jwks.keys[0].kid;

      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const header = decodeJWTHeader(token.access_token);

      expect(header.kid).toBe(jwkKid);
    });
  });
});

describe("JWT Validation with JWKS", () => {
  // Helper to get public key from JWKS
  async function getPublicKeyFromJWKS(kid: string) {
    const jwksResponse = await SELF.fetch("http://example.com/jwks");
    const jwks = await jwksResponse.json() as any;

    const jwk = jwks.keys.find((k: any) => k.kid === kid);
    if (!jwk) {
      throw new Error(`Key with kid ${kid} not found in JWKS`);
    }

    return await importJWK(jwk, "RS256");
  }

  // Helper to decode JWT header to get kid
  function getKidFromJWT(jwt: string): string {
    const parts = jwt.split('.');
    const header = parts[0];
    const decoded = atob(header.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded);
    return parsed.kid;
  }

  describe("Client ID Document Token Validation", () => {
    it("validates JWT signature using JWKS", async () => {
      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      // Verify JWT signature and claims
      const { payload } = await jwtVerify(jwt, publicKey, {
        algorithms: ["RS256"]
      });

      expect(payload).toBeDefined();
      expect(payload.iss).toBeDefined();
      expect(payload.sub).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it("validates JWT claims match expected values", async () => {
      const metadataResponse = await SELF.fetch("http://example.com/oauth-client");
      const metadata = await metadataResponse.json() as any;

      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      const { payload } = await jwtVerify(jwt, publicKey, {
        algorithms: ["RS256"]
      });

      // Verify iss and sub match client_id
      expect(payload.iss).toBe(metadata.client_id);
      expect(payload.sub).toBe(metadata.client_id);
    });

    it("validates JWT with custom audience", async () => {
      const customAud = "https://auth-server.example.com/token";
      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aud: customAud })
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      // Verify with audience claim validation
      const { payload } = await jwtVerify(jwt, publicKey, {
        algorithms: ["RS256"],
        audience: customAud
      });

      expect(payload.aud).toBe(customAud);
    });

    it("validates JWT expiration claim", async () => {
      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      // jwtVerify will automatically validate exp claim
      const { payload } = await jwtVerify(jwt, publicKey, {
        algorithms: ["RS256"]
      });

      // Verify exp is in the future
      const now = Math.floor(Date.now() / 1000);
      expect(payload.exp).toBeGreaterThan(now);
    });
  });

  describe("Private Key JWT Token Validation", () => {
    it("validates JWT signature using JWKS", async () => {
      const tokenResponse = await SELF.fetch("http://example.com/private-key-jwt-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      const { payload } = await jwtVerify(jwt, publicKey, {
        algorithms: ["RS256"]
      });

      expect(payload).toBeDefined();
      expect(payload.iss).toBeDefined();
      expect(payload.sub).toBeDefined();
    });

    it("validates JWT with custom client_id", async () => {
      const customClientId = "test-client-456";
      const tokenResponse = await SELF.fetch("http://example.com/private-key-jwt-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: customClientId })
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      const { payload } = await jwtVerify(jwt, publicKey, {
        algorithms: ["RS256"]
      });

      expect(payload.iss).toBe(customClientId);
      expect(payload.sub).toBe(customClientId);
    });

    it("validates JWT with custom audience array", async () => {
      const customAud = ["https://api1.example.com", "https://api2.example.com"];
      const tokenResponse = await SELF.fetch("http://example.com/private-key-jwt-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aud: customAud })
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      // Verify with one of the audiences
      const { payload } = await jwtVerify(jwt, publicKey, {
        algorithms: ["RS256"],
        audience: customAud[0]
      });

      expect(payload.aud).toEqual(customAud);
    });
  });

  describe("JWT Signature Verification", () => {
    it("rejects JWT with invalid signature", async () => {
      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      // Tamper with the JWT by modifying the payload
      const parts = jwt.split('.');
      const tamperedPayload = parts[1].split('').reverse().join('');
      const tamperedJwt = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      // Expect verification to fail
      await expect(
        jwtVerify(tamperedJwt, publicKey, { algorithms: ["RS256"] })
      ).rejects.toThrow();
    });

    it("validates JWT issuer claim", async () => {
      const metadataResponse = await SELF.fetch("http://example.com/oauth-client");
      const metadata = await metadataResponse.json() as any;

      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      // Verify with issuer claim validation
      const { payload } = await jwtVerify(jwt, publicKey, {
        algorithms: ["RS256"],
        issuer: metadata.client_id
      });

      expect(payload.iss).toBe(metadata.client_id);
    });

    it("rejects JWT with wrong issuer", async () => {
      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST"
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      // Expect verification to fail with wrong issuer
      await expect(
        jwtVerify(jwt, publicKey, {
          algorithms: ["RS256"],
          issuer: "https://wrong-issuer.example.com"
        })
      ).rejects.toThrow();
    });

    it("rejects JWT with wrong audience", async () => {
      const customAud = "https://auth-server.example.com/token";
      const tokenResponse = await SELF.fetch("http://example.com/client-id-document-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aud: customAud })
      });

      const token = await tokenResponse.json() as any;
      const jwt = token.access_token;

      const kid = getKidFromJWT(jwt);
      const publicKey = await getPublicKeyFromJWKS(kid);

      // Expect verification to fail with wrong audience
      await expect(
        jwtVerify(jwt, publicKey, {
          algorithms: ["RS256"],
          audience: "https://wrong-audience.example.com"
        })
      ).rejects.toThrow();
    });
  });
});
