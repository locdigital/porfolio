/**
 * Server-side Cloudflare Turnstile verification module.
 *
 * loc.digital currently uses `mailto:` and direct messaging channels instead of
 * server-submitted contact or booking forms. This module provides ready-to-use,
 * strictly server-side token validation for any future `/api/contact` or `/api/booking`
 * endpoint without adding browser overhead until a form is introduced.
 */

export const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerificationInput {
  token: string;
  remoteIp?: string;
  expectedHostname?: string;
  expectedAction?: string;
  expectedCdata?: string;
  idempotencyKey?: string;
  secretKey?: string;
  timeoutMs?: number;
}

export interface TurnstileSiteverifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

export interface TurnstileVerificationResult {
  success: boolean;
  hostname?: string;
  action?: string;
  challengeTs?: string;
  errorCodes: string[];
  reason?: string;
}

export function getTurnstileConfig(
  env: Record<string, string | undefined> = process.env,
): { enabled: boolean; siteKeyConfigured: boolean; secretKeyConfigured: boolean } {
  const siteKeyConfigured = Boolean(env.PUBLIC_TURNSTILE_SITE_KEY?.trim());
  const secretKeyConfigured = Boolean(env.TURNSTILE_SECRET_KEY?.trim());
  return {
    enabled: siteKeyConfigured && secretKeyConfigured,
    siteKeyConfigured,
    secretKeyConfigured,
  };
}

/**
 * Extracts the originating client IP from standard Vercel / Cloudflare proxy headers.
 */
export function extractClientIp(headers: Headers): string | undefined {
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip")?.trim() || undefined;
}

/**
 * Validates a Turnstile response token directly against Cloudflare's Siteverify API.
 * Never trust client-supplied verification flags; always call this from a server route.
 */
export async function verifyTurnstileToken(
  input: TurnstileVerificationInput,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileVerificationResult> {
  if (typeof window !== "undefined") {
    throw new Error("verifyTurnstileToken must only run on the server.");
  }

  const secret = (input.secretKey ?? process.env.TURNSTILE_SECRET_KEY ?? "").trim();
  if (!secret) {
    return {
      success: false,
      errorCodes: ["missing-input-secret"],
      reason: "TURNSTILE_SECRET_KEY is not configured.",
    };
  }

  const token = input.token?.trim();
  if (!token || token.length > 2048) {
    return {
      success: false,
      errorCodes: ["missing-input-response"],
      reason: "Turnstile verification token is missing or malformed.",
    };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (input.remoteIp) form.set("remoteip", input.remoteIp);
  if (input.idempotencyKey) form.set("idempotency_key", input.idempotencyKey);

  let response: Response;
  try {
    response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(input.timeoutMs ?? 8_000),
    });
  } catch (error) {
    return {
      success: false,
      errorCodes: ["network-error"],
      reason: error instanceof Error ? error.message : "Failed to reach Turnstile verification API.",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      errorCodes: [`http-${response.status}`],
      reason: `Turnstile siteverify responded with HTTP ${response.status}.`,
    };
  }

  const payload = (await response.json()) as TurnstileSiteverifyResponse;
  const errorCodes = Array.isArray(payload["error-codes"]) ? payload["error-codes"] : [];

  if (!payload.success) {
    return {
      success: false,
      hostname: payload.hostname,
      action: payload.action,
      challengeTs: payload.challenge_ts,
      errorCodes,
      reason: "Turnstile challenge verification failed.",
    };
  }

  if (input.expectedHostname && payload.hostname !== input.expectedHostname) {
    return {
      success: false,
      hostname: payload.hostname,
      action: payload.action,
      challengeTs: payload.challenge_ts,
      errorCodes: [...errorCodes, "hostname-mismatch"],
      reason: `Unexpected Turnstile hostname: ${payload.hostname ?? "none"}.`,
    };
  }

  if (input.expectedAction && payload.action !== input.expectedAction) {
    return {
      success: false,
      hostname: payload.hostname,
      action: payload.action,
      challengeTs: payload.challenge_ts,
      errorCodes: [...errorCodes, "action-mismatch"],
      reason: `Unexpected Turnstile action: ${payload.action ?? "none"}.`,
    };
  }

  if (input.expectedCdata && payload.cdata !== input.expectedCdata) {
    return {
      success: false,
      hostname: payload.hostname,
      action: payload.action,
      challengeTs: payload.challenge_ts,
      errorCodes: [...errorCodes, "cdata-mismatch"],
      reason: "Turnstile cdata mismatch.",
    };
  }

  return {
    success: true,
    hostname: payload.hostname,
    action: payload.action,
    challengeTs: payload.challenge_ts,
    errorCodes: [],
  };
}
