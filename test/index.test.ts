// RFC Compliance Test Suite
// Tests RFC 7523, RFC 7517, RFC 7591 compliance

import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

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
