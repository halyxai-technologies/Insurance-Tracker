"use client";

import { useMemo, useState } from "react";
import { FileText, Plus, Search, X } from "lucide-react";
import type { Policy } from "@/lib/types";
import type { Status } from "@/lib/format";
import { matches, status } from "@/lib/format";
import { PolicyCard } from "../PolicyCard";
import { Empty, PageHeader, Segmented } from "../ui";

type SF = "" | Status;

export function Policies({
  data,
  companies,
  statusFilter,
  setStatusFilter,
  onAdd,
}: {
  data: Policy[];
  companies: string[];
  statusFilter: SF;
  setStatusFilter: (s: SF) => void;
  onAdd: () => void;
}) {
  const [q, setQ] = useState("");
  const [company, setCompany] = useState("");

  const rows = useMemo(
    () =>
      data
        .filter((r) => matches(r, q) && (!statusFilter || status(r) === statusFilter) && (!company || r.company === company))
        .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [data, q, statusFilter, company]
  );

  return (
    <div className="view">
      <PageHeader
        eyebrow="Book of business"
        title="All policies"
        sub={`${rows.length} of ${data.length} ${data.length === 1 ? "policy" : "policies"}`}
        actions={
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={17} /> New policy
          </button>
        }
      />

      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone or policy number"
            aria-label="Search policies"
            autoComplete="off"
          />
          {q && (
            <button className="search-clear" onClick={() => setQ("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="toolbar-row">
          <Segmented<SF>
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "All" },
              { value: "a", label: "Active" },
              { value: "w", label: "Expiring" },
              { value: "x", label: "Expired" },
            ]}
          />
          <select className="select" value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Company">
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {rows.length ? (
        <div className="cards">
          {rows.map((p) => (
            <PolicyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <Empty icon={<FileText size={22} />} title={data.length ? "No matching policies" : "No policies saved yet"}>
          {data.length ? (
            "Try a different name, number or filter."
          ) : (
            <button className="btn btn-primary" onClick={onAdd}>
              <Plus size={16} /> Add policy
            </button>
          )}
        </Empty>
      )}
    </div>
  );
}
