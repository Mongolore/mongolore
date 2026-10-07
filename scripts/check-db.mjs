/**
 * Read-only health check of the Supabase database setup.
 *
 *   npm run db:check
 *
 * Prints whether the tables, trigger and policies exist and how many rows
 * they hold — counts only, never emails or other personal data.
 * Uses SUPABASE_DB_URL or SUPABASE_CONNECTION_STRING from .env.local.
 */
import { readFileSync } from "node:fs";
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
  console.error("Add SUPABASE_CONNECTION_STRING to .env.local first.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
// Every statement in this session is read-only, enforced by Postgres.
await client.query("set default_transaction_read_only = on");
try {
  const one = async (sql) => (await client.query(sql)).rows[0];
  const tables = (
    await client.query(
      "select table_name from information_schema.tables where table_schema = 'public' and table_name in ('profiles','lesson_progress')",
    )
  ).rows.map((r) => r.table_name);
  console.log("Tables:", tables.length ? tables.join(", ") : "MISSING");
  if (tables.length < 2) process.exit(1);

  const trigger = await one(
    "select count(*)::int as n from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal",
  );
  const policies = (
    await client.query("select tablename, policyname from pg_policies where schemaname = 'public' order by 1, 2")
  ).rows;
  const rls = (
    await client.query(
      "select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relname in ('profiles','lesson_progress')",
    )
  ).rows;
  const counts = await one(`select
      (select count(*)::int from auth.users) as users,
      (select count(*)::int from public.profiles) as profiles,
      (select count(*)::int from public.profiles where xp > 0) as with_xp,
      (select coalesce(max(xp), 0)::int from public.profiles) as top_xp,
      (select count(*)::int from public.lesson_progress) as lessons`);

  console.log("New-user trigger:", trigger.n === 1 ? "ok" : "MISSING");
  console.log("Row-level security:", rls.map((r) => `${r.relname}=${r.relrowsecurity ? "on" : "OFF"}`).join(", "));
  console.log("Policies:", policies.map((p) => `${p.tablename}: ${p.policyname}`).join(" | ") || "none");
  console.log(
    `Users: ${counts.users} · profiles: ${counts.profiles} · with XP: ${counts.with_xp} (top ${counts.top_xp} XP) · finished lessons: ${counts.lessons}`,
  );
} finally {
  await client.end();
}
