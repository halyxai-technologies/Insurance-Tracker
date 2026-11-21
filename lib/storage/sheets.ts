import type { Policy } from "../types";
import type { Store } from "./index";
import { normalize } from "./normalize";

/**
 * Google Sheet via an Apps Script web app (see /apps-script/Code.gs).
 * The URL is only ever used on the server, so it is never exposed to browsers.
 * Also works with the original tracker's script (same GET / POST protocol).
 */
export function sheetsStore(url: string, token: string): Store {
  async function call(body?: object) {
    const u = new URL(url);
    let res: Response;
    if (body) {
      res = await fetch(u, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...body, token }),
        redirect: "follow",
        cache: "no-store",
      });
    } else {
      u.searchParams.set("t", String(Date.now()));
      if (token) u.searchParams.set("token", token);
      res = await fetch(u, { redirect: "follow", cache: "no-store" });
    }
    const text = await res.text();
    let j: { ok?: boolean; error?: string; data?: unknown };
    try {
      j = JSON.parse(text);
    } catch {
      throw new Error("Google Sheet did not return valid data. Check the Apps Script deployment (access: Anyone).");
    }
    if (!j.ok) throw new Error(j.error || "Google Sheet request failed");
    return j;
  }

  return {
    name: "Google Sheet",
    async list() {
      const j = await call();
      const rows = Array.isArray(j.data) ? (j.data as Record<string, unknown>[]) : [];
      return rows.map(normalize).filter((p) => p.id);
    },
    async add(record: Policy) {
      await call({ action: "add", record });
    },
    async update(record: Policy) {
      await call({ action: "update", record });
    },
    async remove(id: string) {
      await call({ action: "delete", id });
    },
    async addMany(records: Policy[]) {
      try {
        await call({ action: "bulkAdd", records });
      } catch (e) {
        // Older scripts don't support bulkAdd – fall back to one-by-one.
        if (!/unknown|action/i.test(String((e as Error).message))) throw e;
        for (const r of records) await call({ action: "add", record: r });
      }
    },
  };
}
