import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { SESSION_COOKIE, SESSION_DAYS, createSession, expectedPassword, expectedUser } from "@/lib/auth";

const sha = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const user = expectedUser();
  const pass = expectedPassword();
  if (!user || !pass || (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET)) {
    return NextResponse.json(
      { ok: false, error: "Login is not set up yet. Add ADMIN_USERNAME, ADMIN_PASSWORD and AUTH_SECRET in Vercel." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const remember = body.remember !== false;

  // Evaluate both comparisons to keep timing uniform.
  const okUser = same(username.toLowerCase(), user.toLowerCase());
  const okPass = same(password, pass);
  if (!(okUser && okPass)) {
    await wait(700 + Math.random() * 500); // slows down password guessing
    return NextResponse.json({ ok: false, error: "Incorrect username or password" }, { status: 401 });
  }

  const days = remember ? SESSION_DAYS : 1;
  const token = await createSession(user, days);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: days * 86400 } : {}),
  });
  return res;
}
