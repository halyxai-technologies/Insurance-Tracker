import { promises as fs } from "fs";
import path from "path";
import type { Policy } from "../types";
import type { Store } from "./index";

/** Local development only: keeps data in .data/policies.json */
export function fileStore(): Store {
  const file = path.join(process.cwd(), ".data", "policies.json");
  const read = async (): Promise<Policy[]> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return [];
    }
  };
  const write = async (rows: Policy[]) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(rows, null, 2));
  };
  return {
    name: "Local file",
    list: read,
    async add(p) {
      const rows = await read();
      if (!rows.some((r) => r.id === p.id)) rows.unshift(p);
      await write(rows);
    },
    async update(p) {
      await write((await read()).map((r) => (r.id === p.id ? p : r)));
    },
    async remove(id) {
      await write((await read()).filter((r) => r.id !== id));
    },
    async addMany(ps) {
      const rows = await read();
      const ids = new Set(rows.map((r) => r.id));
      await write([...ps.filter((p) => !ids.has(p.id)), ...rows]);
    },
  };
}
