import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { ConfigError, getStore, normalize, validate } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authed() {
  const jar = await cookies();
  return !!(await verifySession(jar.get(SESSION_COOKIE)?.value));
}

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

function errorResponse(e: unknown) {
  const msg = e instanceof Error ? e.message : "Something went wrong";
  return fail(msg, e instanceof ConfigError ? 503 : 502);
}

export async function GET() {
  if (!(await authed())) return fail("Unauthorized", 401);
  try {
    const store = getStore();
    const data = await store.list();
    return NextResponse.json({ ok: true, data, storage: store.name }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  if (!(await authed())) return fail("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") return fail("Bad request", 400);

  try {
    const store = getStore();
    switch (body.action) {
      case "add":
      case "update": {
        const rec = normalize(body.record || {});
        const err = validate(rec);
        if (err) return fail(err, 400);
        await (body.action === "add" ? store.add(rec) : store.update(rec));
        return NextResponse.json({ ok: true, record: rec });
      }
      case "delete": {
        const id = String(body.id || "");
        if (!/^[\w-]+$/.test(id)) return fail("Invalid id", 400);
        await store.remove(id);
        return NextResponse.json({ ok: true });
      }
      case "import": {
        const list = Array.isArray(body.records) ? body.records.slice(0, 500) : [];
        const recs = list.map(normalize);
        const bad = recs.map(validate).findIndex(Boolean);
        if (bad >= 0) return fail(`Row ${bad + 1}: ${validate(recs[bad])}`, 400);
        await store.addMany(recs);
        return NextResponse.json({ ok: true, count: recs.length });
      }
      default:
        return fail("Unknown action", 400);
    }
  } catch (e) {
    return errorResponse(e);
  }
}
