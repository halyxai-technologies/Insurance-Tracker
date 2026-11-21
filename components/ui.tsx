"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import type { Status } from "@/lib/format";
import { STATUS_TEXT } from "@/lib/format";

/* ---------------- Status chip ---------------- */
export function StatusChip({ s, note }: { s: Status; note?: string }) {
  return (
    <span className={`chip chip-${s}`}>
      <i className="dot" />
      {STATUS_TEXT[s]}
      {note ? <em> · {note}</em> : null}
    </span>
  );
}

/* ---------------- Page header ---------------- */
export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="page-actions noprint">{actions}</div>}
    </header>
  );
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <p className="empty-title">{title}</p>
      {children && <div className="empty-body">{children}</div>}
    </div>
  );
}

/* ---------------- Segmented chips ---------------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Modal / bottom sheet ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("locked");
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("locked");
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-grip" />
        {title && (
          <div className="modal-head">
            <h2>{title}</h2>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ---------------- Toasts + confirm (context) ---------------- */
type ToastT = { id: number; msg: string; kind: "ok" | "err" | "info" };
type ConfirmReq = { title: string; body?: string; confirm?: string; danger?: boolean; resolve: (v: boolean) => void };

const Ctx = createContext<{
  toast: (msg: string, kind?: ToastT["kind"]) => void;
  confirm: (o: Omit<ConfirmReq, "resolve">) => Promise<boolean>;
} | null>(null);

export const useUI = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("UIProvider missing");
  return c;
};

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastT[]>([]);
  const [req, setReq] = useState<ConfirmReq | null>(null);

  const toast = useCallback((msg: string, kind: ToastT["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);
  const confirm = useCallback(
    (o: Omit<ConfirmReq, "resolve">) => new Promise<boolean>((resolve) => setReq({ ...o, resolve })),
    []
  );
  const close = (v: boolean) => {
    req?.resolve(v);
    setReq(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.kind === "err" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
      <Modal open={!!req} onClose={() => close(false)}>
        {req && (
          <div className="confirm">
            <div className={`confirm-icon${req.danger ? " danger" : ""}`}>
              <AlertTriangle size={22} />
            </div>
            <h2>{req.title}</h2>
            {req.body && <p className="muted">{req.body}</p>}
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => close(false)}>
                Cancel
              </button>
              <button className={`btn ${req.danger ? "btn-danger" : "btn-primary"}`} onClick={() => close(true)} autoFocus>
                {req.confirm || "Confirm"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Ctx.Provider>
  );
}
