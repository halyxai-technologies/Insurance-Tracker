"use client";

import { useMemo } from "react";
import { ArrowRight, BellRing, CalendarClock, FileText, Plus, ShieldCheck, ShieldX } from "lucide-react";
import type { Policy } from "@/lib/types";
import { aed, status, today } from "@/lib/format";
import { BUSINESS } from "@/lib/config";
import { PolicyRow } from "../PolicyCard";
import { Empty } from "../ui";
import type { View } from "../TrackerApp";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function Dashboard({ data, go }: { data: Policy[]; go: (v: View, filter?: string) => void }) {
  const s = useMemo(() => {
    const st = data.map((r) => [r, status(r)] as const);
    const soon = st
      .filter(([, x]) => x === "w")
      .map(([r]) => r)
      .sort((a, b) => a.expireDate.localeCompare(b.expireDate));
    const month = today().slice(0, 7);
    const thisMonth = data.filter((r) => (r.date || "").startsWith(month));
    return {
      total: data.length,
      active: st.filter(([, x]) => x !== "x").length,
      expired: st.filter(([, x]) => x === "x").length,
      soon,
      sell: data.reduce((a, r) => a + Number(r.sell || 0), 0),
      profit: data.reduce((a, r) => a + Number(r.profit || 0), 0),
      monthProfit: thisMonth.reduce((a, r) => a + Number(r.profit || 0), 0),
      monthCount: thisMonth.length,
      recent: [...data].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 4),
    };
  }, [data]);

  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="view">
      <section className="hero">
        <div className="hero-top">
          <div>
            <p className="eyebrow gold">{dateStr}</p>
            <h1 className="hero-title">{BUSINESS.owner ? <>{greeting()}, <em>{BUSINESS.owner}</em></> : <>{greeting().replace(/ \w+$/, "")} <em>{greeting().split(" ")[1]}</em></>}</h1>
          </div>
          <div className="hero-actions noprint">
            <button className="btn btn-gold" onClick={() => go("add")}>
              <Plus size={17} /> Add policy
            </button>
            <button className="btn btn-glass" onClick={() => go("renewals")}>
              <BellRing size={16} /> Renewals{s.soon.length ? ` (${s.soon.length})` : ""}
            </button>
          </div>
        </div>
        <div className="hero-figures">
          <div>
            <span>Total profit</span>
            <strong>{aed(s.profit)}</strong>
          </div>
          <div>
            <span>Total sales</span>
            <strong>{aed(s.sell)}</strong>
          </div>
          <div>
            <span>This month</span>
            <strong>
              {aed(s.monthProfit)}
              <small>
                {" "}
                · {s.monthCount} {s.monthCount === 1 ? "policy" : "policies"}
              </small>
            </strong>
          </div>
        </div>
      </section>

      <section className="kpis">
        <button className="kpi" onClick={() => go("policies")}>
          <span className="kpi-icon navy">
            <FileText size={18} />
          </span>
          <span className="kpi-label">Total policies</span>
          <strong>{s.total}</strong>
        </button>
        <button className="kpi" onClick={() => go("policies", "a")}>
          <span className="kpi-icon ok">
            <ShieldCheck size={18} />
          </span>
          <span className="kpi-label">Active</span>
          <strong>{s.active}</strong>
        </button>
        <button className="kpi" onClick={() => go("renewals")}>
          <span className="kpi-icon warn">
            <CalendarClock size={18} />
          </span>
          <span className="kpi-label">Expiring in 30 days</span>
          <strong>{s.soon.length}</strong>
        </button>
        <button className="kpi" onClick={() => go("policies", "x")}>
          <span className="kpi-icon bad">
            <ShieldX size={18} />
          </span>
          <span className="kpi-label">Expired</span>
          <strong>{s.expired}</strong>
        </button>
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Renewals due</h2>
              <p className="muted small">Next 30 days, soonest first</p>
            </div>
            <button className="link-btn" onClick={() => go("renewals")}>
              Open all <ArrowRight size={15} />
            </button>
          </div>
          {s.soon.length ? (
            <div className="rows">
              {s.soon.slice(0, 6).map((p) => (
                <PolicyRow key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <Empty icon={<ShieldCheck size={22} />} title="All clear">
              No renewals due in the next 30 days.
            </Empty>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Recently added</h2>
              <p className="muted small">Latest policies saved</p>
            </div>
            <button className="link-btn" onClick={() => go("policies")}>
              All policies <ArrowRight size={15} />
            </button>
          </div>
          {s.recent.length ? (
            <div className="rows">
              {s.recent.map((p) => (
                <PolicyRow key={p.id} p={p} showExpiry={false} />
              ))}
            </div>
          ) : (
            <Empty icon={<FileText size={22} />} title="No policies yet">
              <button className="btn btn-primary" onClick={() => go("add")}>
                <Plus size={16} /> Add your first policy
              </button>
            </Empty>
          )}
        </section>
      </div>
    </div>
  );
}
