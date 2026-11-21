"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Search, X } from "lucide-react";
import type { Policy } from "@/lib/types";
import { aed, fmtDate, fmtPhone, matches, today } from "@/lib/format";
import { BUSINESS } from "@/lib/config";
import { PageHeader } from "../ui";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function presets() {
  const n = new Date();
  const y = n.getFullYear();
  const m = n.getMonth();
  return {
    month: [ymd(new Date(y, m, 1)), ymd(new Date(y, m + 1, 0))],
    last: [ymd(new Date(y, m - 1, 1)), ymd(new Date(y, m, 0))],
    year: [`${y}-01-01`, `${y}-12-31`],
    all: ["", ""],
  } as Record<string, [string, string]>;
}

export function exportCsv(rows: Policy[], name: string) {
  const h = ["Date", "Customer", "Phone", "Policy No", "Company", "Type", "Insurance.P", "Issue", "Expire", "Purchase", "Sell", "Profit"];
  const lines = rows.map((r) =>
    [r.date, r.name, fmtPhone(r.phone), r.policyNo, r.company, r.type, r.insuranceP, r.issueDate, r.expireDate, r.purchase, r.sell, r.profit]
      .map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"')
      .join(",")
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + [h.join(","), ...lines].join("\n")], { type: "text/csv" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function Statement({ data, companies }: { data: Policy[]; companies: string[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [company, setCompany] = useState("");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      data
        .filter((r) => (!from || r.date >= from) && (!to || r.date <= to) && (!company || r.company === company) && matches(r, q))
        .sort((a, b) => (a.date || "").localeCompare(b.date || "")),
    [data, from, to, company, q]
  );
  const sum = (k: "purchase" | "sell" | "profit") => rows.reduce((a, r) => a + Number(r[k] || 0), 0);
  const P = presets();
  const active = Object.entries(P).find(([, [a, b]]) => a === from && b === to)?.[0];
  const period = from || to ? `${from ? fmtDate(from) : "Beginning"} – ${to ? fmtDate(to) : "Today"}` : "All time";

  return (
    <div className="view">
      <PageHeader
        eyebrow="Accounts"
        title="Statement"
        sub={period}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => exportCsv(rows, `statement-${today()}.csv`)}>
              <Download size={16} /> CSV
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> Print / PDF
            </button>
          </>
        }
      />

      <div className="print-head">
        <h1>{BUSINESS.name}</h1>
        <p>
          Statement · {period}
          {company ? ` · ${company}` : ""} · Generated {fmtDate(today())}
        </p>
      </div>

      <section className="panel filters noprint">
        <div className="chips">
          {[
            ["all", "All time"],
            ["month", "This month"],
            ["last", "Last month"],
            ["year", "This year"],
          ].map(([k, l]) => (
            <button
              key={k}
              className={`chip-btn${active === k ? " on" : ""}`}
              onClick={() => {
                setFrom(P[k][0]);
                setTo(P[k][1]);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="filter-grid">
          <label className="field">
            <span>From date</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field">
            <span>To date</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="field">
            <span>Company</span>
            <select value={company} onChange={(e) => setCompany(e.target.value)}>
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Customer / phone</span>
            <div className="search compact">
              <Search size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Optional" />
              {q && (
                <button className="search-clear" onClick={() => setQ("")} aria-label="Clear">
                  <X size={14} />
                </button>
              )}
            </div>
          </label>
        </div>
      </section>

      <section className="summary">
        <div>
          <span>Policies</span>
          <strong>{rows.length}</strong>
        </div>
        <div>
          <span>Purchase</span>
          <strong>{aed(sum("purchase"))}</strong>
        </div>
        <div>
          <span>Sales</span>
          <strong>{aed(sum("sell"))}</strong>
        </div>
        <div className="hl">
          <span>Profit</span>
          <strong>{aed(sum("profit"))}</strong>
        </div>
      </section>

      <section className="panel table-panel">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Policy no</th>
              <th>Company</th>
              <th>Type</th>
              <th className="r">Purchase</th>
              <th className="r">Sell</th>
              <th className="r">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Date" className="nowrap">{fmtDate(r.date)}</td>
                  <td data-label="Customer" className="strong">
                    {r.name}
                  </td>
                  <td data-label="Phone" className="nowrap">
                    {fmtPhone(r.phone)}
                  </td>
                  <td data-label="Policy no" className="mono nowrap">
                    {r.policyNo}
                  </td>
                  <td data-label="Company">{r.company}</td>
                  <td data-label="Type">{r.type}</td>
                  <td data-label="Purchase" className="r nowrap">
                    {aed(r.purchase)}
                  </td>
                  <td data-label="Sell" className="r nowrap">
                    {aed(r.sell)}
                  </td>
                  <td data-label="Profit" className={`r nowrap strong ${r.profit < 0 ? "neg" : "pos"}`}>
                    {aed(r.profit)}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="empty-row">
                <td colSpan={9}>No records for this filter.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}>Total ({rows.length} policies)</td>
              <td className="r nowrap" data-label="Purchase">
                {aed(sum("purchase"))}
              </td>
              <td className="r nowrap" data-label="Sell">
                {aed(sum("sell"))}
              </td>
              <td className="r nowrap" data-label="Profit">
                {aed(sum("profit"))}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
