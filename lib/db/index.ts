import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import path from "path";

// Windows-safe absolute path to local SQLite file
const dbPath = path.resolve(process.cwd(), "sqlite.db");
const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });
export { client };
