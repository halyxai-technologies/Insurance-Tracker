"use client";

import { useState } from "react";
import { Download, FileUp, Loader2, Upload } from "lucide-react";
import type { Policy } from "@/lib/types";
import { digits, newId, today } from "@/lib/format";
import { Modal, useUI } from "./ui";
import { exportCsv } from "./views/Statement";

/* Minimal RFC-4180 CSV parser (quotes, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const ALIASES: Record<string, keyof Policy> = {
  date: "date",
  customer: "name",
  customername: "name",
  name: "name",
  phone: "phone",
  phoneno: "phone",
  mobile: "phone",
  policyno: "policyNo",
  policynumber: "policyNo",
  policy: "policyNo",
  company: "company",
  type: "type",
  insurancetype: "type",
  insurancep: "insuranceP",
  issue: "issueDate",
  issuedate: "issueDate",
  expire: "expireDate",
  expiredate: "expireDate",
  expiry: "expireDate",
  expirydate: "expireDate",
  purchase: "purchase",
  purchaseamount: "purchase",
  sell: "sell",
  sellamount: "sell",
  id: "id",
  createdat: "createdAt",
};

function toPolicies(rows: string[][]): { records: Policy[]; skipped: number } {
  const [head, ...body] = rows;
  const map = head.map((h) => ALIASES[h.toLowerCase().replace(/[^a-z]/g, "")]);
  let skipped = 0;
  const records: Policy[] = [];
  for (const r of body) {
    const o: Record<string, string> = {};
    map.forEach((k, i) => k && (o[k] = (r[i] ?? "").trim()));
    if (!o.name || !o.policyNo || digits(o.phone).length !== 9) {
      skipped++;
      continue;
    }
    const purchase = Number(String(o.purchase || "").replace(/[^\d.-]/g, "")) || 0;
    const sell = Number(String(o.sell || "").replace(/[^\d.-]/g, "")) || 0;
    records.push({
      id: o.id && /^[\w-]+$/.test(o.id) ? o.id : newId() + records.length.toString(36),
      name: o.name,
      phone: "+971" + digits(o.phone),
      policyNo: o.policyNo,
      date: o.date || "",
      purchase,
      sell,
      profit: sell - purchase,
      issueDate: o.issueDate || "",
      expireDate: o.expireDate || "",
      type: o.type || "",
      insuranceP: o.insuranceP || "",
      company: o.company || "",
      createdAt: o.createdAt || new Date().toISOString(),
    });
  }
  return { records, skipped };
}

export function ImportDialog({
  open,
  onClose,
  data,
  importMany,
}: {
  open: boolean;
  onClose: () => void;
  data: Policy[];
  importMany: (r: Policy[]) => Promise<void>;
}) {
  const { toast } = useUI();
  const [parsed, setParsed] = useState<{ records: Policy[]; skipped: number; dupes: number; file: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    const { records, skipped } = toPolicies(parseCsv(await file.text()));
    const have = new Set(data.map((r) => r.policyNo.toLowerCase()));
    const fresh = records.filter((r) => !have.has(r.policyNo.toLowerCase()));
    setParsed({ records: fresh, skipped, dupes: records.length - fresh.length, file: file.name });
  }

  async function run() {
    if (!parsed?.records.length) return;
    setBusy(true);
    try {
      await importMany(parsed.records);
      toast(`Imported ${parsed.records.length} policies`);
      setParsed(null);
      onClose();
    } catch (e) {
      toast((e as Error).message || "Import failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setParsed(null);
        onClose();
      }}
      title="Import & backup"
    >
      <div className="modal-body stack">
        <div className="callout">
          <strong>Back up everything</strong>
          <p className="muted small">Download every policy as a CSV file you can open in Excel or Google Sheets.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCsv(data, `all-policies-${today()}.csv`)} disabled={!data.length}>
            <Download size={15} /> Download all ({data.length})
          </button>
        </div>

        <div className="callout">
          <strong>Import from CSV</strong>
          <p className="muted small">
            Use a CSV with columns like <em>Date, Customer, Phone, Policy No, Company, Type, Insurance.P, Issue, Expire, Purchase, Sell</em>.
            The statement CSV from the old tracker works as is. Policy numbers already saved are skipped.
          </p>
          <label className="dropzone">
            <FileUp size={20} />
            <span>{parsed ? parsed.file : "Choose a .csv file"}</span>
            <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} hidden />
          </label>
          {parsed && (
            <p className="small">
              <strong>{parsed.records.length}</strong> new {parsed.records.length === 1 ? "policy" : "policies"} ready
              {parsed.dupes ? ` · ${parsed.dupes} already saved` : ""}
              {parsed.skipped ? ` · ${parsed.skipped} skipped (missing name, policy no or valid phone)` : ""}
            </p>
          )}
          <button className="btn btn-primary" onClick={run} disabled={!parsed?.records.length || busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <Upload size={16} />} Import
          </button>
        </div>
      </div>
    </Modal>
  );
}
