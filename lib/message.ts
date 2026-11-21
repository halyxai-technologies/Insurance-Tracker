import type { Policy } from "./types";
import { days, digits, fmtDate } from "./format";
import { DEFAULT_TEMPLATE } from "./config";

export const TOKENS = ["name", "policy", "company", "expiry", "days", "status"] as const;

export function buildMessage(r: Policy, template: string) {
  const n = days(r.expireDate);
  const exp = fmtDate(r.expireDate);
  const st =
    n < 0 ? `expired on ${exp} (${-n} ${-n === 1 ? "day" : "days"} ago)` : n === 0 ? `expires today (${exp})` : `will expire on ${exp} (${n} ${n === 1 ? "day" : "days"} left)`;
  const v: Record<string, string | number> = { name: r.name, policy: r.policyNo, company: r.company, expiry: exp, days: n, status: st };
  return (template.trim() || DEFAULT_TEMPLATE).replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));
}

export const waLink = (r: Policy, template: string) =>
  `https://wa.me/971${digits(r.phone)}?text=${encodeURIComponent(buildMessage(r, template))}`;
