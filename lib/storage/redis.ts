import type { Policy } from "../types";
import type { Store } from "./index";
import { normalize } from "./normalize";

const KEY = "ict:policies";

/** Upstash Redis over its REST API (no extra dependency). One hash field per policy. */
export function redisStore(url: string, token: string): Store {
  async function cmd(args: (string | number)[]) {
    const res = await fetch(url.replace(/\/$/, ""), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.error) throw new Error(j.error || `Redis error ${res.status}`);
    return j.result;
  }

  return {
    name: "Upstash Redis",
    async list() {
      const flat: string[] = (await cmd(["HGETALL", KEY])) || [];
      const out: Policy[] = [];
      for (let i = 1; i < flat.length; i += 2) {
        try {
          out.push(normalize(JSON.parse(flat[i])));
        } catch {
          /* skip corrupt entry */
        }
      }
      return out;
    },
    async add(p) {
      await cmd(["HSET", KEY, p.id, JSON.stringify(p)]);
    },
    async update(p) {
      await cmd(["HSET", KEY, p.id, JSON.stringify(p)]);
    },
    async remove(id) {
      await cmd(["HDEL", KEY, id]);
    },
    async addMany(ps) {
      if (!ps.length) return;
      await cmd(["HSET", KEY, ...ps.flatMap((p) => [p.id, JSON.stringify(p)])]);
    },
  };
}
