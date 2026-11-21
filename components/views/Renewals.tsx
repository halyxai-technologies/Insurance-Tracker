"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, MessageSquareText, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import type { Policy } from "@/lib/types";
import { days, matches } from "@/lib/format";
import { DEFAULT_TEMPLATE } from "@/lib/config";
import { TOKENS, buildMessage } from "@/lib/message";
import { PolicyCard } from "../PolicyCard";
import { Empty, PageHeader, Segmented, useUI } from "../ui";

type Range = "7" | "15" | "30" | "60" | "x" | "all";

const SAMPLE: Policy = {
  id: "sample",
  name: "Ahmed",
  phone: "+971501234567",
  policyNo: "POL-2045",
  date: "",
  purchase: 0,
  sell: 0,
  profit: 0,
  issueDate: "",
  expireDate: "",
  type: "Comprehensive",
  insuranceP: "",
  company: "Orient",
  createdAt: "",
};

export function Renewals({
  data,
  template,
  setTemplate,
}: {
  data: Policy[];
  template: string;
  setTemplate: (v: string | null) => void;
}) {
  const { toast } = useUI();
  const [range, setRange] = useState<Range>("30");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);

  const rows = useMemo(
    () =>
      data
        .filter((r) => {
          const n = days(r.expireDate);
          if (isNaN(n) || !matches(r, q)) return false;
          return range === "x" ? n < 0 : range === "all" ? n <= 30 : n >= 0 && n <= +range;
        })
        .sort((a, b) => a.expireDate.localeCompare(b.expireDate)),
    [data, range, q]
  );

  const preview = useMemo(() => {
    const p = rows[0] || { ...SAMPLE, expireDate: new Date(Date.now() + 12 * 864e5).toISOString().slice(0, 10) };
    return buildMessage(p, template);
  }, [rows, template]);

  function insert(token: string) {
    const el = ta.current;
    const t = `{${token}}`;
    if (!el) return setTemplate(template + t);
    const { selectionStart: a, selectionEnd: b } = el;
    const next = template.slice(0, a) + t + template.slice(b);
    setTemplate(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + t.length, a + t.length);
    });
  }

  return (
    <div className="view">
      <PageHeader eyebrow="Follow-ups" title="Renewals & reminders" sub={`${rows.length} ${rows.length === 1 ? "policy needs" : "policies need"} attention`} />

      <div className="toolbar">
        <div className="toolbar-row wrap">
          <Segmented<Range>
            label="Show policies"
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "7 days" },
              { value: "15", label: "15 days" },
              { value: "30", label: "30 days" },
              { value: "60", label: "60 days" },
              { value: "x", label: "Expired" },
              { value: "all", label: "Expired + 30d" },
            ]}
          />
        </div>
        <div className="search">
          <Search size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" aria-label="Search renewals" />
          {q && (
            <button className="search-clear" onClick={() => setQ("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <section className={`panel template noprint${open ? " open" : ""}`}>
        <button className="template-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="kpi-icon wa">
            <MessageSquareText size={18} />
          </span>
          <span>
            <strong>WhatsApp message</strong>
            <span className="muted small">Edit the reminder text sent to customers</span>
          </span>
          <ChevronDown size={18} className="chev" />
        </button>
        {open && (
          <div className="template-body">
            <div className="template-edit">
              <textarea ref={ta} rows={5} value={template} onChange={(e) => setTemplate(e.target.value)} aria-label="WhatsApp message template" />
              <div className="tokens">
                <span className="muted small">Insert:</span>
                {TOKENS.map((t) => (
                  <button key={t} type="button" className="token" onClick={() => insert(t)}>
                    {`{${t}}`}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setTemplate(null);
                  toast("Message reset to default");
                }}
                disabled={template === DEFAULT_TEMPLATE}
              >
                <RotateCcw size={14} /> Reset message
              </button>
            </div>
            <div className="bubble-wrap">
              <span className="muted small">Preview</span>
              <div className="bubble">{preview}</div>
            </div>
          </div>
        )}
      </section>

      {rows.length ? (
        <div className="cards">
          {rows.map((p) => (
            <PolicyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <Empty icon={<ShieldCheck size={22} />} title="Everyone is covered">
          No policies in this range.
        </Empty>
      )}
    </div>
  );
}
