"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Op, Policy } from "./types";

const LS_DATA = "ict.data";
const LS_QUEUE = "ict.queue";

export type SyncState = "loading" | "synced" | "pending" | "offline" | "error";

const readLS = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const writeLS = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full / private mode */
  }
};

class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function api(method: "GET" | "POST", body?: Op) {
  const res = await fetch("/api/policies", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) {
    window.location.replace("/login");
    throw new HttpError("Signed out", 401);
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new HttpError(j.error || `Request failed (${res.status})`, res.status);
  return j;
}

/** 4xx (other than 401/408/429) means the request itself is wrong – retrying won't help. */
const permanent = (e: unknown) => e instanceof HttpError && e.status >= 400 && e.status < 500 && ![401, 408, 429].includes(e.status);

export function usePolicies() {
  const [data, setData] = useState<Policy[]>([]);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>("loading");
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<string>("");
  const dataRef = useRef<Policy[]>([]);
  const flushing = useRef<Promise<void> | null>(null);

  const commit = useCallback((next: Policy[]) => {
    dataRef.current = next;
    setData(next);
    writeLS(LS_DATA, next);
  }, []);

  const queue = () => readLS<Op[]>(LS_QUEUE, []);
  const setQueue = (q: Op[]) => {
    writeLS(LS_QUEUE, q);
    setPending(q.length);
  };

  const flush = useCallback(async () => {
    if (flushing.current) return flushing.current;
    flushing.current = (async () => {
      let q = queue();
      while (q.length) {
        try {
          await api("POST", q[0]);
        } catch (e) {
          if (!permanent(e)) throw e;
          setError((e as Error).message);
        }
        q = q.slice(1);
        setQueue(q);
      }
    })().finally(() => {
      flushing.current = null;
    });
    return flushing.current;
  }, []);

  const load = useCallback(async () => {
    try {
      await flush();
      const j = await api("GET");
      commit(j.data as Policy[]);
      setStorage(j.storage || "");
      setSync("synced");
      setError(null);
    } catch (e) {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setSync(offline || e instanceof TypeError ? "offline" : "error");
      if (!offline && !(e instanceof TypeError)) setError((e as Error).message);
    } finally {
      setReady(true);
    }
  }, [commit, flush]);

  useEffect(() => {
    const cached = readLS<Policy[]>(LS_DATA, []);
    dataRef.current = cached;
    setData(cached);
    setPending(queue().length);
    if (cached.length) setReady(true);
    load();
    const onOnline = () => load();
    const onFocus = () => document.visibilityState === "visible" && load();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  /** Apply locally first, then send. Returns "synced" | "queued", throws on a permanent error. */
  const send = useCallback(
    async (op: Op, next: Policy[], prev: Policy[]): Promise<"synced" | "queued"> => {
      commit(next);
      try {
        if (queue().length) throw new TypeError("queue not empty"); // keep order
        await api("POST", op);
        setSync("synced");
        return "synced";
      } catch (e) {
        if (permanent(e)) {
          commit(prev);
          throw e;
        }
        setQueue([...queue(), op]);
        setSync("pending");
        flush().then(() => setSync("synced")).catch(() => setSync(navigator.onLine ? "error" : "offline"));
        return "queued";
      }
    },
    [commit, flush]
  );

  const save = useCallback(
    (rec: Policy, editing: boolean) => {
      const prev = dataRef.current;
      const next = editing ? prev.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...prev];
      return send({ action: editing ? "update" : "add", record: rec }, next, prev);
    },
    [send]
  );

  const remove = useCallback(
    (id: string) => {
      const prev = dataRef.current;
      return send({ action: "delete", id }, prev.filter((r) => r.id !== id), prev);
    },
    [send]
  );

  const importMany = useCallback(
    async (records: Policy[]) => {
      for (let i = 0; i < records.length; i += 200) {
        await api("POST", { action: "import", records: records.slice(i, i + 200) });
      }
      await load();
    },
    [load]
  );

  return { data, ready, sync, pending, error, storage, save, remove, importMany, reload: load };
}

export function useLocalState(key: string, initial: string) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s !== null) setV(s);
    } catch {}
  }, [key]);
  const set = useCallback(
    (nv: string | null) => {
      try {
        if (nv === null) localStorage.removeItem(key);
        else localStorage.setItem(key, nv);
      } catch {}
      setV(nv ?? initial);
    },
    [key, initial]
  );
  return [v, set] as const;
}
