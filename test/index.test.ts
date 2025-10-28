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
