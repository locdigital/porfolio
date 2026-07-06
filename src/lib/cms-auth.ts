const SESSION_COOKIE = "cms_session";
const LEGACY_SESSION_COOKIE = "session";

function readEnv(name: string) {
  return process.env[name];
}

export function isCmsDisabledInProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function getCmsAuthConfig() {
  const username = readEnv("CMS_USERNAME");
  const password = readEnv("CMS_PASSWORD");
  const sessionSecret = readEnv("CMS_SESSION_SECRET");

  return {
    username,
    password,
    sessionSecret,
    configured: Boolean(username && password && sessionSecret),
  };
}

function getCookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function isCmsRequestAuthorized(request: Request) {
  const { sessionSecret, configured } = getCmsAuthConfig();
  if (!configured) return false;
  return getCookieValue(request, SESSION_COOKIE) === sessionSecret;
}

export function createCmsSessionCookie() {
  const { sessionSecret, configured } = getCmsAuthConfig();
  if (!configured || !sessionSecret) {
    throw new Error("CMS auth is not configured.");
  }

  return `${SESSION_COOKIE}=${encodeURIComponent(sessionSecret)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800`;
}

export function clearCmsSessionCookies() {
  return [
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`,
    `${LEGACY_SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`,
  ];
}
