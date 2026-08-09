import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { schema } from "./schema";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");

  if (!globalForDb.db) {
    globalForDb.sql = postgres(url, { prepare: false });
    globalForDb.db = drizzle(globalForDb.sql, { schema });
  }

  return globalForDb.db;
}
