"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2, Save, X } from "lucide-react";
import type { Policy } from "@/lib/types";
import { INSURANCE_TYPES } from "@/lib/types";
import { aed, addYear, digits, groupPhone, newId, today } from "@/lib/format";
import { PageHeader, useUI } from "../ui";

type FormState = {
  name: string;
  phone: string;
  policyNo: string;
  date: string;
  purchase: string;
  sell: string;
  issueDate: string;
  expireDate: string;
  type: string;
  insuranceP: string;
  company: string;
};

const blank = (): FormState => ({
  name: "",
  phone: "",
  policyNo: "",
  date: today(),
  purchase: "",
  sell: "",
  issueDate: today(),
  expireDate: "",
  type: "",
  insuranceP: "",
  company: "",
});

const fromPolicy = (p: Policy): FormState => ({
  name: p.name,
  phone: groupPhone(digits(p.phone)),
  policyNo: p.policyNo,
  date: p.date,
  purchase: String(p.purchase ?? ""),
  sell: String(p.sell ?? ""),
  issueDate: p.issueDate,
  expireDate: p.expireDate,
  type: p.type,
  insuranceP: p.insuranceP,
  company: p.company,
});

export function PolicyForm({
  editing,
  data,
  companies,
  onSave,
  onCancel,
}: {
  editing: Policy | null;
  data: Policy[];
  companies: string[];
  onSave: (rec: Policy, editing: boolean) => Promise<"synced" | "queued">;
  onCancel: () => void;
}) {
  const { toast, confirm } = useUI();
  const [f, setF] = useState<FormState>(() => (editing ? fromPolicy(editing) : blank()));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    setF(editing ? fromPolicy(editing) : blank());
    setErr({});
  }, [editing]);

  const set = <K extends keyof FormState>(k: K, v: string) => {
    setF((s) => ({ ...s, [k]: v }));
    if (err[k]) setErr((e) => ({ ...e, [k]: undefined }));
  };

  const profit = useMemo(() => (f.purchase !== "" && f.sell !== "" ? Number(f.sell) - Number(f.purchase) : null), [f.purchase, f.sell]);
  const types = editing?.type && !INSURANCE_TYPES.includes(editing.type) ? [...INSURANCE_TYPES, editing.type] : INSURANCE_TYPES;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errors: typeof err = {};
    if (!f.name.trim()) errors.name = "Enter the customer name";
    if (digits(f.phone).length !== 9) errors.phone = "Enter a valid UAE number, e.g. 50 123 4567";
    if (!f.policyNo.trim()) errors.policyNo = "Enter the policy number";
    if (f.expireDate && f.issueDate && f.expireDate < f.issueDate) errors.expireDate = "Expire date cannot be before issue date";
    if (Object.keys(errors).length) {
      setErr(errors);
      toast(Object.values(errors)[0]!, "err");
      document.getElementById("f-" + Object.keys(errors)[0])?.focus();
      return;
    }

    const policyNo = f.policyNo.trim();
    const dup = data.find((r) => r.policyNo.toLowerCase() === policyNo.toLowerCase() && r.id !== editing?.id);
    if (dup) {
      const ok = await confirm({
        title: "Duplicate policy number",
        body: `Policy ${policyNo} is already saved for ${dup.name}. Save this one anyway?`,
        confirm: "Save anyway",
      });
      if (!ok) return;
    }

    const purchase = Number(f.purchase) || 0;
    const sell = Number(f.sell) || 0;
    const rec: Policy = {
      id: editing?.id || newId(),
      name: f.name.trim(),
      phone: "+971" + digits(f.phone),
      policyNo,
      date: f.date,
      purchase,
      sell,
      profit: Math.round((sell - purchase) * 100) / 100,
      issueDate: f.issueDate,
      expireDate: f.expireDate,
      type: f.type,
      insuranceP: f.insuranceP.trim(),
      company: f.company.trim(),
      createdAt: editing?.createdAt || new Date().toISOString(),
      ...(editing?.remindedAt ? { remindedAt: editing.remindedAt } : {}),
    };

    setBusy(true);
    try {
      const r = await onSave(rec, !!editing);
      toast(r === "synced" ? (editing ? "Policy updated" : "Policy saved") : "Saved on this device · will sync when online", r === "synced" ? "ok" : "info");
      if (editing) onCancel();
      else setF(blank());
    } catch (e2) {
      toast((e2 as Error).message || "Could not save", "err");
    } finally {
      setBusy(false);
    }
  }

  const F = ({ id, label, children, hint, wide }: { id: keyof FormState; label: string; children: React.ReactNode; hint?: string; wide?: boolean }) => (
    <div className={`field${err[id] ? " has-err" : ""}${wide ? " span-2" : ""}`}>
      <label htmlFor={"f-" + id}>{label}</label>
      {children}
      {err[id] ? <p className="field-err">{err[id]}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );

  return (
    <div className="view">
      <PageHeader
        eyebrow={editing ? "Update record" : "New record"}
        title={editing ? "Edit policy" : "Add new policy"}
        sub={editing ? `${editing.name} · ${editing.policyNo}` : "Fill in the details below. Profit is calculated for you."}
        actions={
          editing ? (
            <button className="btn btn-ghost" onClick={onCancel}>
              <X size={16} /> Cancel edit
            </button>
          ) : null
        }
      />

      <form className="form" onSubmit={submit} autoComplete="off" noValidate>
        <section className="panel form-section">
          <h2 className="form-h">
            <span>01</span> Customer
          </h2>
          <div className="form-grid">
            {F({
              id: "name",
              label: "Customer name",
              children: <input id="f-name" value={f.name} onChange={(e) => set("name", e.target.value)} autoCapitalize="words" required />,
            })}
            {F({
              id: "phone",
              label: "Phone no",
              hint: "9 digits, e.g. 50 123 4567",
              children: (
                <div className="input-prefix">
                  <span>+971</span>
                  <input
                    id="f-phone"
                    inputMode="numeric"
                    placeholder="50 123 4567"
                    value={f.phone}
                    onChange={(e) => set("phone", groupPhone(digits(e.target.value).slice(0, 9)))}
                    required
                  />
                </div>
              ),
            })}
          </div>
        </section>

        <section className="panel form-section">
          <h2 className="form-h">
            <span>02</span> Policy
          </h2>
          <div className="form-grid">
            {F({
              id: "policyNo",
              label: "Policy number",
              children: <input id="f-policyNo" className="mono" value={f.policyNo} onChange={(e) => set("policyNo", e.target.value)} required />,
            })}
            {F({
              id: "company",
              label: "Company",
              children: (
                <>
                  <input id="f-company" list="company-list" value={f.company} onChange={(e) => set("company", e.target.value)} />
                  <datalist id="company-list">
                    {companies.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </>
              ),
            })}
            {F({
              id: "type",
              label: "Insurance type",
              children: (
                <select id="f-type" value={f.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="">Select type</option>
                  {types.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              ),
            })}
            {F({
              id: "insuranceP",
              label: "Insurance.P",
              children: <input id="f-insuranceP" placeholder="e.g. 1 year" value={f.insuranceP} onChange={(e) => set("insuranceP", e.target.value)} />,
            })}
            {F({
              id: "date",
              label: "Date",
              hint: "Sale / entry date used in statements",
              children: <input id="f-date" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />,
            })}
          </div>
        </section>

        <section className="panel form-section">
          <h2 className="form-h">
            <span>03</span> Cover period
          </h2>
          <div className="form-grid">
            {F({
              id: "issueDate",
              label: "Issue date",
              children: <input id="f-issueDate" type="date" value={f.issueDate} onChange={(e) => set("issueDate", e.target.value)} />,
            })}
            {F({
              id: "expireDate",
              label: "Expire date",
              children: (
                <div className="input-row">
                  <input id="f-expireDate" type="date" value={f.expireDate} onChange={(e) => set("expireDate", e.target.value)} />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => f.issueDate && set("expireDate", addYear(f.issueDate))}
                    disabled={!f.issueDate}
                    title="Set expiry to one year after the issue date"
                  >
                    <CalendarPlus size={15} /> 1 year
                  </button>
                </div>
              ),
            })}
          </div>
        </section>

        <section className="panel form-section">
          <h2 className="form-h">
            <span>04</span> Amounts
          </h2>
          <div className="form-grid three">
            {F({
              id: "purchase",
              label: "Purchase amount (AED)",
              children: (
                <input id="f-purchase" type="number" inputMode="decimal" min="0" step="0.01" value={f.purchase} onChange={(e) => set("purchase", e.target.value)} />
              ),
            })}
            {F({
              id: "sell",
              label: "Sell amount (AED)",
              children: <input id="f-sell" type="number" inputMode="decimal" min="0" step="0.01" value={f.sell} onChange={(e) => set("sell", e.target.value)} />,
            })}
            <div className="field">
              <label>Profit (AED)</label>
              <div className={`profit-box${profit === null ? "" : profit < 0 ? " neg" : " pos"}`} aria-live="polite">
                {profit === null ? <span className="soft">Auto: sell − purchase</span> : aed(profit)}
              </div>
            </div>
          </div>
        </section>

        <div className="form-actions">
          {editing && (
            <button type="button" className="btn btn-ghost btn-lg" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            {busy ? "Saving…" : editing ? "Save changes" : "Save policy"}
          </button>
        </div>
      </form>
    </div>
  );
}
