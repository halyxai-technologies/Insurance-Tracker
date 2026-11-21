import type { Policy } from "./types";

export type Status = "a" | "w" | "x";
export const STATUS_TEXT: Record<Status, string> = { a: "Active", w: "Expiring soon", x: "Expired" };

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const aed = (n: unknown) => "AED " + nf.format(Number(n) || 0);
export const aedShort = (n: unknown) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return "AED " + (v / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2).replace(/\.0+$/, "") + "M";
  if (abs >= 100_000) return "AED " + (v / 1000).toFixed(0) + "K";
  return "AED " + nf0.format(v);
};
export const num = (n: unknown) => nf.format(Number(n) || 0);

/** UAE mobile digits without country code / leading zero, e.g. "501234567" */
export const digits = (p: unknown) => {
  let d = String(p ?? "").replace(/\D/g, "");
  if (d.startsWith("971")) d = d.slice(3);
  return d.replace(/^0+/, "");
};
export const groupPhone = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(" ");
export const fmtPhone = (p: unknown) => {
  const d = digits(p);
  return d ? "+971 " + groupPhone(d) : "";
};

const pad = (n: number) => String(n).padStart(2, "0");
/** Today's date in the device's local time zone, YYYY-MM-DD */
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const utc = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
};
/** Whole days from today until the given date (negative = in the past) */
export const days = (d: string) => Math.round((utc(d) - utc(today())) / 864e5);

export const status = (r: Policy): Status => {
  const n = days(r.expireDate);
  return isNaN(n) ? "a" : n < 0 ? "x" : n <= 30 ? "w" : "a";
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (s?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : s || "—";
};

export const addYear = (s: string) => {
  const t = utc(s);
  if (isNaN(t)) return "";
  const d = new Date(t);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function matches(r: Policy, q: string) {
  if (!q) return true;
  const s = q.toLowerCase().trim();
  if (!s) return true;
  const d = digits(q);
  const hay = `${r.name} ${r.policyNo} ${r.company}`.toLowerCase();
  return hay.includes(s) || (d.length >= 2 && digits(r.phone).includes(d));
}

export function daysLabel(n: number) {
  if (isNaN(n)) return "";
  if (n === 0) return "Expires today";
  if (n === 1) return "1 day left";
  if (n > 0) return `${n} days left`;
  if (n === -1) return "Expired yesterday";
  return `Expired ${-n} days ago`;
}
