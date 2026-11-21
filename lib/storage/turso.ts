import { createClient, type Client, type InStatement } from "@libsql/client";
import type { Policy } from "../types";
import type { Store } from "./index";
import { normalize } from "./normalize";

/** Turso (libSQL / SQLite). The table is created automatically on first use. */

const SCHEMA = `CREATE TABLE IF NOT EXISTS policies (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  policy_no   TEXT NOT NULL,
  date        TEXT,
  purchase    REAL NOT NULL DEFAULT 0,
  sell        REAL NOT NULL DEFAULT 0,
  profit      REAL NOT NULL DEFAULT 0,
  issue_date  TEXT,
  expire_date TEXT,
  type        TEXT,
  insurance_p TEXT,
  company     TEXT,
  created_at  TEXT,
  reminded_at TEXT
)`;

const COLS = [
  ["id", "id"],
  ["name", "name"],
  ["phone", "phone"],
  ["policy_no", "policyNo"],
  ["date", "date"],
  ["purchase", "purchase"],
  ["sell", "sell"],
  ["profit", "profit"],
  ["issue_date", "issueDate"],
  ["expire_date", "expireDate"],
  ["type", "type"],
  ["insurance_p", "insuranceP"],
  ["company", "company"],
  ["created_at", "createdAt"],
  ["reminded_at", "remindedAt"],
] as const;

const UPSERT = `INSERT INTO policies (${COLS.map((c) => c[0]).join(", ")})
VALUES (${COLS.map(() => "?").join(", ")})
ON CONFLICT(id) DO UPDATE SET ${COLS.slice(1)
  .map(([c]) => `${c} = excluded.${c}`)
  .join(", ")}`;

const upsert = (p: Policy): InStatement => ({
  sql: UPSERT,
  args: COLS.map(([, k]) => (p[k] ?? null) as string | number | null),
});

let client: Client | null = null;
let ready: Promise<unknown> | null = null;

export function tursoStore(url: string, authToken?: string): Store {
  client ??= createClient({ url, authToken });
  const db = client;
  const init = () => (ready ??= db.execute(SCHEMA).catch((e) => {
    ready = null; // retry on next request
    throw e;
  }));

  return {
    name: "Turso",
    async list() {
      await init();
      const rs = await db.execute("SELECT * FROM policies ORDER BY created_at DESC");
      return rs.rows.map((row) => {
        const raw: Record<string, unknown> = {};
        for (const [col, key] of COLS) raw[key] = row[col];
        return normalize(raw);
      });
    },
    async add(p) {
      await init();
      await db.execute(upsert(p));
    },
    async update(p) {
      await init();
      await db.execute(upsert(p));
    },
    async remove(id) {
      await init();
      await db.execute({ sql: "DELETE FROM policies WHERE id = ?", args: [id] });
    },
    async addMany(ps) {
      if (!ps.length) return;
      await init();
      await db.batch(ps.map(upsert), "write");
    },
  };
}
