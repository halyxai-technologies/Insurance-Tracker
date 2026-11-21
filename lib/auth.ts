import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ict_session";
export const SESSION_DAYS = 30;

const DEV_SECRET = "dev-only-secret-do-not-use-in-production-0123456789";

function secretKey(): Uint8Array | null {
  const s = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? DEV_SECRET : "");
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export async function createSession(username: string, days = SESSION_DAYS) {
  const key = secretKey();
  if (!key) throw new Error("AUTH_SECRET is not configured");
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(key);
}

export async function verifySession(token: string | undefined | null) {
  if (!token) return null;
  const key = secretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    // Only the configured account is valid; changing ADMIN_USERNAME signs everyone out.
    if (payload.sub !== expectedUser()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function expectedUser() {
  return process.env.ADMIN_USERNAME || (process.env.NODE_ENV !== "production" ? "admin" : "");
}
export function expectedPassword() {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "admin" : "");
}
