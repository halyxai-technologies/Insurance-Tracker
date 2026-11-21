import type { Policy } from "../types";

/* ---------- Normalisation (data coming back from Sheets can be loosely typed) ---------- */

const dubaiDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" });

function toDate(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO timestamps from Sheets Date cells: convert to the UAE calendar day
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    return isNaN(+d) ? s.slice(0, 10) : dubaiDate.format(d);
  }
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s); // dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(s);
  return isNaN(+d) ? s : dubaiDate.format(d);
}

const n = (v: unknown) => {
  const x = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return isFinite(x) ? Math.round(x * 100) / 100 : 0;
};
const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

export function normalize(raw: Record<string, unknown>): Policy {
  let d = String(raw.phone ?? "").replace(/\D/g, "");
  if (d.startsWith("971")) d = d.slice(3);
  d = d.replace(/^0+/, "");
  const purchase = n(raw.purchase);
  const sell = n(raw.sell);
  const p: Policy = {
    id: str(raw.id, 64),
    name: str(raw.name),
    phone: d ? "+971" + d : "",
    policyNo: str(raw.policyNo, 100),
    date: toDate(raw.date),
    purchase,
    sell,
    profit: Math.round((sell - purchase) * 100) / 100,
    issueDate: toDate(raw.issueDate),
    expireDate: toDate(raw.expireDate),
    type: str(raw.type, 60),
    insuranceP: str(raw.insuranceP, 60),
    company: str(raw.company, 100),
    createdAt: str(raw.createdAt, 40),
  };
  const rem = toDate(raw.remindedAt);
  if (rem) p.remindedAt = rem;
  return p;
}

export function validate(p: Policy): string | null {
  if (!p.id || !/^[\w-]+$/.test(p.id)) return "Invalid record id";
  if (!p.name) return "Customer name is required";
  if (!p.policyNo) return "Policy number is required";
  if (p.phone.replace(/\D/g, "").length !== 12) return "Phone must be a 9-digit UAE number";
  if (p.expireDate && p.issueDate && p.expireDate < p.issueDate) return "Expire date cannot be before issue date";
  return null;
}
