import "server-only";
import type { Policy } from "../types";
import { sheetsStore } from "./sheets";
import { redisStore } from "./redis";
import { fileStore } from "./file";
import { tursoStore } from "./turso";
export { normalize, validate } from "./normalize";

export interface Store {
  name: string;
  list(): Promise<Policy[]>;
  add(p: Policy): Promise<void>;
  update(p: Policy): Promise<void>;
  remove(id: string): Promise<void>;
  addMany(ps: Policy[]): Promise<void>;
}

export class ConfigError extends Error {}

/**
 * Turso settings. The Vercel Marketplace integration sets TURSO_DATABASE_URL / TURSO_AUTH_TOKEN,
 * or "<PREFIX>_TURSO_DATABASE_URL" / "<PREFIX>_TURSO_AUTH_TOKEN" if a custom prefix was chosen
 * when connecting. Each URL is always paired with the token that has the same prefix.
 */
function tursoEnv(): { url: string; token?: string } | null {
  const env = process.env;
  if (env.TURSO_DATABASE_URL) return { url: env.TURSO_DATABASE_URL, token: env.TURSO_AUTH_TOKEN };
  const key = Object.keys(env).find((k) => /^[A-Za-z0-9_]+_TURSO_DATABASE_URL$/.test(k) && env[k]);
  if (!key) return null;
  const prefix = key.slice(0, -"TURSO_DATABASE_URL".length);
  return { url: env[key]!, token: env[prefix + "TURSO_AUTH_TOKEN"] };
}

export function getStore(): Store {
  const turso = tursoEnv();
  if (turso) return tursoStore(turso.url, turso.token);
  if (process.env.GOOGLE_SCRIPT_URL) return sheetsStore(process.env.GOOGLE_SCRIPT_URL, process.env.GOOGLE_SCRIPT_TOKEN || "");
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisStore(url, token);
  if (!process.env.VERCEL) return fileStore();
  throw new ConfigError(
    "No database is connected. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your Vercel project settings."
  );
}
