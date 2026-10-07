/**
 * Creates the Supabase tables by running every file in supabase/migrations/.
 *
 *   npm run db:setup
 *
 * Needs SUPABASE_DB_URL (or SUPABASE_CONNECTION_STRING) in .env.local —
 * Supabase dashboard → Connect → a connection string (direct or session
 * pooler) with your database password filled in.
 * Safe to run again: the migrations only create what's missing.
 */
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]),
);

const url = env.SUPABASE_DB_URL || env.SUPABASE_CONNECTION_STRING;
if (!url) {
  console.error(
    "Add SUPABASE_CONNECTION_STRING to .env.local first.\n" +
      "Supabase dashboard → Connect → copy a connection string and put your database password in it.",
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const dir = "supabase/migrations";
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    process.stdout.write(`Running ${file} … `);
    await client.query(readFileSync(`${dir}/${file}`, "utf8"));
    console.log("done");
  }
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  console.log("Tables now in your database:", rows.map((r) => r.table_name).join(", "));
} finally {
  await client.end();
}
