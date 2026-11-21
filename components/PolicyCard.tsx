"use client";

import { createContext, useContext } from "react";
import { Check, ChevronRight, MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import type { Policy } from "@/lib/types";
import { aed, days, daysLabel, digits, fmtDate, fmtPhone, initials, status } from "@/lib/format";
import { StatusChip } from "./ui";

export type Actions = {
  remind: (p: Policy) => void;
  edit: (p: Policy) => void;
  del: (p: Policy) => void;
  open: (p: Policy) => void;
};
export const ActionsCtx = createContext<Actions | null>(null);
const useActions = () => useContext(ActionsCtx)!;

function note(p: Policy) {
  const s = status(p);
  return s === "w" ? daysLabel(days(p.expireDate)) : undefined;
}

export function PolicyCard({ p }: { p: Policy }) {
  const a = useActions();
  const s = status(p);
  return (
    <article className={`pcard pcard-${s}`}>
      <div className="pcard-head">
        <div className="avatar" aria-hidden="true">
          {initials(p.name)}
        </div>
        <div className="pcard-who">
          <h3>{p.name}</h3>
          <a className="pcard-phone" href={`tel:+971${digits(p.phone)}`}>
            {fmtPhone(p.phone)}
          </a>
        </div>
        <StatusChip s={s} note={note(p)} />
      </div>

      <dl className="pcard-meta">
        <div>
          <dt>Policy no</dt>
          <dd className="mono">{p.policyNo}</dd>
        </div>
        <div>
          <dt>Company</dt>
          <dd>{p.company || "—"}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>
            {p.type || "—"}
            {p.insuranceP ? <span className="soft"> · {p.insuranceP}</span> : null}
          </dd>
        </div>
        <div>
          <dt>Cover period</dt>
          <dd>
            {fmtDate(p.issueDate)} <span className="soft">→</span> {fmtDate(p.expireDate)}
          </dd>
        </div>
        <div>
          <dt>Purchase / Sell</dt>
          <dd>
            {aed(p.purchase)} <span className="soft">/</span> {aed(p.sell)}
          </dd>
        </div>
        <div>
          <dt>Profit</dt>
          <dd className={p.profit < 0 ? "neg" : "pos"}>{aed(p.profit)}</dd>
        </div>
      </dl>

      {p.remindedAt && (
        <p className="reminded">
          <Check size={14} /> Reminder sent on {fmtDate(p.remindedAt)}
        </p>
      )}

      <div className="pcard-actions noprint">
        <button className="btn btn-wa" onClick={() => a.remind(p)}>
          <MessageCircle size={16} /> WhatsApp
        </button>
        <a className="btn btn-ghost" href={`tel:+971${digits(p.phone)}`}>
          <Phone size={16} /> Call
        </a>
        <span className="grow" />
        <button className="icon-btn" onClick={() => a.edit(p)} aria-label={`Edit ${p.name}`} title="Edit">
          <Pencil size={17} />
        </button>
        <button className="icon-btn danger" onClick={() => a.del(p)} aria-label={`Delete ${p.name}`} title="Delete">
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}

/** Compact row used on the dashboard; tap to open full details. */
export function PolicyRow({ p, showExpiry = true }: { p: Policy; showExpiry?: boolean }) {
  const a = useActions();
  const s = status(p);
  const n = days(p.expireDate);
  return (
    <div className="prow">
      <button className="prow-main" onClick={() => a.open(p)}>
        <span className="avatar sm" aria-hidden="true">
          {initials(p.name)}
        </span>
        <span className="prow-text">
          <strong>{p.name}</strong>
          <span>
            {p.company || "—"} · <span className="mono">{p.policyNo}</span>
          </span>
        </span>
        <span className="prow-side">
          {showExpiry ? (
            <>
              <span className={`prow-days s-${s}`}>{s === "x" ? "Expired" : n === 0 ? "Today" : `${n}d`}</span>
              <span className="soft">{fmtDate(p.expireDate)}</span>
            </>
          ) : (
            <>
              <span className="prow-amt">{aed(p.sell)}</span>
              <span className="soft">{fmtDate(p.date)}</span>
            </>
          )}
        </span>
        <ChevronRight size={16} className="prow-chev" />
      </button>
      {showExpiry && (
        <button className="icon-btn wa" onClick={() => a.remind(p)} aria-label={`WhatsApp ${p.name}`} title="Send WhatsApp reminder">
          <MessageCircle size={17} />
        </button>
      )}
    </div>
  );
}
