"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CloudOff,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Loader2,
  LogOut,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";
import type { Policy } from "@/lib/types";
import type { Status } from "@/lib/format";
import { status, today } from "@/lib/format";
import { BUSINESS, DEFAULT_TEMPLATE } from "@/lib/config";
import { waLink } from "@/lib/message";
import { useLocalState, usePolicies } from "@/lib/useStore";
import type { SyncState } from "@/lib/useStore";
import { BrandMark } from "./BrandMark";
import { ActionsCtx, PolicyCard } from "./PolicyCard";
import type { Actions } from "./PolicyCard";
import { Modal, UIProvider, useUI } from "./ui";
import { ImportDialog } from "./ImportDialog";
import { Dashboard } from "./views/Dashboard";
import { Policies } from "./views/Policies";
import { Renewals } from "./views/Renewals";
import { PolicyForm } from "./views/PolicyForm";
import { Statement } from "./views/Statement";

export type View = "home" | "policies" | "renewals" | "add" | "statement";
const VIEWS: View[] = ["home", "policies", "renewals", "add", "statement"];

const NAV: { v: View; label: string; icon: React.ElementType }[] = [
  { v: "home", label: "Dashboard", icon: LayoutGrid },
  { v: "policies", label: "Policies", icon: FileText },
  { v: "renewals", label: "Renewals", icon: BellRing },
  { v: "statement", label: "Statement", icon: FileSpreadsheet },
];

export function TrackerApp() {
  return (
    <UIProvider>
      <App />
    </UIProvider>
  );
}

function SyncPill({ sync, pending, onRetry }: { sync: SyncState; pending: number; onRetry: () => void }) {
  const text =
    sync === "loading"
      ? "Syncing…"
      : pending
        ? `${pending} waiting to sync`
        : sync === "synced"
          ? "All changes saved"
          : sync === "offline"
            ? "Offline · saved on device"
            : sync === "pending"
              ? "Syncing…"
              : "Can't reach database";
  const tone = sync === "synced" && !pending ? "ok" : sync === "error" ? "bad" : "warn";
  return (
    <button className={`sync sync-${tone}`} onClick={onRetry} title="Tap to refresh">
      {sync === "loading" || sync === "pending" ? <Loader2 size={13} className="spin" /> : sync === "offline" ? <CloudOff size={13} /> : <i className="dot" />}
      <span>{text}</span>
    </button>
  );
}

function App() {
  const store = usePolicies();
  const { toast, confirm } = useUI();
  const [view, setViewState] = useState<View>("home");
  const [editing, setEditing] = useState<Policy | null>(null);
  const [detail, setDetail] = useState<Policy | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | Status>("");
  const [menu, setMenu] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [template, setTemplate] = useLocalState("ict.tpl", DEFAULT_TEMPLATE);

  /* ---- hash routing so the phone's back button works ---- */
  useEffect(() => {
    const read = () => {
      const h = location.hash.slice(1) as View;
      setViewState(VIEWS.includes(h) ? h : "home");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (view !== "add") setEditing(null);
    window.scrollTo({ top: 0 });
  }, [view]);

  const go = useCallback((v: View, filter?: string) => {
    if (filter !== undefined || v === "policies") setStatusFilter((filter ?? "") as "" | Status);
    if (location.hash.slice(1) !== v) location.hash = v;
    else setViewState(v);
    setMenu(false);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.replace("/login");
  };

  const companies = useMemo(() => [...new Set(store.data.map((r) => r.company).filter(Boolean))].sort(), [store.data]);
  const dueCount = useMemo(() => store.data.filter((r) => status(r) === "w").length, [store.data]);

  // keep the open detail sheet in sync with the latest data
  useEffect(() => {
    if (detail) setDetail(store.data.find((r) => r.id === detail.id) || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.data]);

  useEffect(() => {
    if (store.error) toast(store.error, "err");
  }, [store.error, toast]);

  const actions: Actions = useMemo(
    () => ({
      open: (p) => setDetail(p),
      edit: (p) => {
        setDetail(null);
        setEditing(p);
        go("add");
      },
      remind: (p) => {
        window.open(waLink(p, template), "_blank", "noopener");
        store.save({ ...p, remindedAt: today() }, true).catch(() => {});
      },
      del: async (p) => {
        const ok = await confirm({
          title: "Delete this policy?",
          body: `Policy ${p.policyNo} of ${p.name} will be removed permanently.`,
          confirm: "Delete",
          danger: true,
        });
        if (!ok) return;
        setDetail(null);
        try {
          const r = await store.remove(p.id);
          toast(r === "synced" ? "Policy deleted" : "Deleted here · will sync when online", r === "synced" ? "ok" : "info");
        } catch (e) {
          toast((e as Error).message, "err");
        }
      },
    }),
    [template, store, confirm, toast, go]
  );

  return (
    <ActionsCtx.Provider value={actions}>
      <div className="shell">
        {/* ---------- Desktop sidebar ---------- */}
        <aside className="sidebar noprint">
          <div className="side-brand">
            <BrandMark size={42} />
            <div>
              <strong>{BUSINESS.name}</strong>
              <span>Policy desk</span>
            </div>
          </div>
          <button className="btn btn-gold btn-block side-add" onClick={() => go("add")}>
            <Plus size={17} /> New policy
          </button>
          <nav className="side-nav" aria-label="Main">
            {NAV.map(({ v, label, icon: Icon }) => (
              <button key={v} className={view === v ? "on" : ""} onClick={() => go(v)} aria-current={view === v ? "page" : undefined}>
                <Icon size={18} />
                <span>{label}</span>
                {v === "renewals" && dueCount > 0 && <b className="badge">{dueCount}</b>}
              </button>
            ))}
          </nav>
          <div className="side-foot">
            <SyncPill sync={store.sync} pending={store.pending} onRetry={store.reload} />
            <div className="side-tools">
              <button onClick={() => setImportOpen(true)}>
                <Upload size={16} /> Import & backup
              </button>
              <button onClick={logout}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </aside>

        <div className="main">
          {/* ---------- Mobile top bar ---------- */}
          <header className="topbar noprint">
            <div className="top-brand">
              <button onClick={() => go("home")} aria-label="Dashboard" className="top-mark">
                <BrandMark size={34} />
              </button>
              <span>
                <strong>{BUSINESS.name}</strong>
                <SyncPill sync={store.sync} pending={store.pending} onRetry={store.reload} />
              </span>
            </div>
            <button className="icon-btn" onClick={() => setMenu(true)} aria-label="More options">
              <MoreHorizontal size={20} />
            </button>
          </header>

          <main className="content">
            {!store.ready ? (
              <div className="loading">
                <Loader2 className="spin" size={26} />
                <span>Loading your policies…</span>
              </div>
            ) : view === "home" ? (
              <Dashboard data={store.data} go={go} />
            ) : view === "policies" ? (
              <Policies data={store.data} companies={companies} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onAdd={() => go("add")} />
            ) : view === "renewals" ? (
              <Renewals data={store.data} template={template} setTemplate={setTemplate} />
            ) : view === "add" ? (
              <PolicyForm
                editing={editing}
                data={store.data}
                companies={companies}
                onSave={store.save}
                onCancel={() => {
                  setEditing(null);
                  history.length > 1 ? history.back() : go("policies");
                }}
              />
            ) : (
              <Statement data={store.data} companies={companies} />
            )}
          </main>
        </div>

        {/* ---------- Mobile bottom tab bar ---------- */}
        <nav className="tabbar noprint" aria-label="Main">
          {NAV.slice(0, 2).map(({ v, label, icon: Icon }) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => go(v)}>
              <Icon size={21} />
              <span>{label === "Dashboard" ? "Home" : label}</span>
            </button>
          ))}
          <button className={`fab${view === "add" ? " on" : ""}`} onClick={() => go("add")} aria-label="Add policy">
            <Plus size={26} />
          </button>
          {NAV.slice(2).map(({ v, label, icon: Icon }) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => go(v)}>
              <span className="tab-icon">
                <Icon size={21} />
                {v === "renewals" && dueCount > 0 && <b className="badge">{dueCount}</b>}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ---------- Mobile "more" sheet ---------- */}
      <Modal open={menu} onClose={() => setMenu(false)} title="More">
        <div className="menu-list">
          <button
            onClick={() => {
              setMenu(false);
              store.reload();
            }}
          >
            <RefreshCw size={18} /> Refresh data
          </button>
          <button
            onClick={() => {
              setMenu(false);
              setImportOpen(true);
            }}
          >
            <Upload size={18} /> Import & backup
          </button>
          <button className="danger" onClick={logout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
        {store.storage && <p className="muted small center">Connected to {store.storage}</p>}
      </Modal>

      {/* ---------- Policy details sheet ---------- */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Policy details">
        {detail && (
          <div className="modal-body">
            <PolicyCard p={detail} />
          </div>
        )}
      </Modal>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} data={store.data} importMany={store.importMany} />
    </ActionsCtx.Provider>
  );
}
