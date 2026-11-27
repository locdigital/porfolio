import { describe, expect, it, vi } from "vitest";
import { extractClientIp, getTurnstileConfig, verifyTurnstileToken } from "./turnstile";

describe("Cloudflare Turnstile server-side verification", () => {
  it("reports configuration status without exposing secrets", () => {
    expect(getTurnstileConfig({})).toEqual({
      enabled: false,
      siteKeyConfigured: false,
      secretKeyConfigured: false,
    });

    expect(
      getTurnstileConfig({
        PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAA_site",
        TURNSTILE_SECRET_KEY: "0x4AAAAAAA_secret",
      }),
    ).toEqual({
      enabled: true,
      siteKeyConfigured: true,
      secretKeyConfigured: true,
    });
  });

  it("extracts client IP prioritizing cf-connecting-ip then x-forwarded-for", () => {
    const h1 = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    expect(extractClientIp(h1)).toBe("203.0.113.10");

    const h2 = new Headers({ "x-forwarded-for": "198.51.100.2, 10.0.0.1" });
    expect(extractClientIp(h2)).toBe("198.51.100.2");
  });

  it("rejects missing secret or missing token cleanly", async () => {
    const missingSecret = await verifyTurnstileToken({ token: "tok", secretKey: "" });
    expect(missingSecret.success).toBe(false);
    expect(missingSecret.errorCodes).toContain("missing-input-secret");

    const missingToken = await verifyTurnstileToken({ token: "", secretKey: "sec" });
    expect(missingToken.success).toBe(false);
    expect(missingToken.errorCodes).toContain("missing-input-response");
  });

  it("verifies valid tokens and enforces hostname/action checks", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          success: true,
          hostname: "loc.digital",
          action: "contact",
          challenge_ts: "2026-11-26T15:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const ok = await verifyTurnstileToken(
      {
        token: "valid-token",
        secretKey: "test-secret",
        expectedHostname: "loc.digital",
        expectedAction: "contact",
        remoteIp: "203.0.113.5",
      },
      mockFetch as unknown as typeof fetch,
    );
    expect(ok.success).toBe(true);
    expect(ok.hostname).toBe("loc.digital");

    const wrongHost = await verifyTurnstileToken(
      {
        token: "valid-token",
        secretKey: "test-secret",
        expectedHostname: "other.example",
      },
      mockFetch as unknown as typeof fetch,
    );
    expect(wrongHost.success).toBe(false);
    expect(wrongHost.errorCodes).toContain("hostname-mismatch");
  });
});
