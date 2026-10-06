import type { APIRoute } from "astro";
import { exchangeGoogleCode } from "../../../../../lib/booking/google";
import { verifyState } from "../../../../../lib/booking/security";

export const GET: APIRoute = async ({ url }) => {
  try {
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    verifyState(state);
    if (!code) throw new Error("Missing Google OAuth code.");
    await exchangeGoogleCode(code);
    return new Response(null, { status: 302, headers: { Location: "/booking/admin?google=connected" } });
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "Google connection failed.");
    return new Response(null, { status: 302, headers: { Location: `/booking/admin?google=error&message=${message}` } });
  }
};
