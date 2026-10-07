import { LESSONS } from "@/lib/lessons";
import { levelInfo } from "@/lib/levels";
import { supabaseAdmin, userFromRequest } from "@/lib/supabaseAdmin";

/**
 * GET  → { data: Progress | null }   the signed-in learner's saved progress
 * PUT  { data: Progress } → { ok }   saves it
 *
 * Stored in the `profiles` and `lesson_progress` tables
 * (supabase/migrations/0001_profiles_and_progress.sql). Every request must
 * carry the user's access token, and only that user's rows are touched.
 */

type Progress = {
  xp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  completed: Record<string, number>;
  claimed: Record<string, true>;
  daily: { day: string; xp: number };
};

type ProfileRow = {
  xp: number;
  streak: number;
  best_streak: number;
  last_active_day: string | null;
  daily_xp: number;
  daily_day: string | null;
  claimed: Record<string, true> | null;
};

const LESSON_IDS = new Set(LESSONS.map((l) => l.id));
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BYTES = 64 * 1024;
/** Progress saved by the earlier Storage-based version, imported once. */
const LEGACY_BUCKET = "progress";

/** PostgREST's "table not found" — the migration hasn't been run yet. */
function tablesMissing(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

const SETUP_HINT =
  "Supabase tables are missing. Run supabase/migrations/0001_profiles_and_progress.sql in the Supabase SQL Editor.";

function fail(error: unknown, label: string) {
  if (tablesMissing(error as { code?: string })) {
    console.error(`[progress] ${SETUP_HINT}`);
    return Response.json({ error: "tables_missing" }, { status: 503 });
  }
  console.error(`[progress] ${label}`, error);
  return Response.json({ error: "failed" }, { status: 500 });
}

async function legacyProgress(userId: string): Promise<Progress | null> {
  const { data } = await supabaseAdmin()!.storage.from(LEGACY_BUCKET).download(`${userId}.json`);
  if (!data) return null;
  try {
    return JSON.parse(await data.text()) as Progress;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const admin = supabaseAdmin();
  if (!admin) return Response.json({ error: "not_configured" }, { status: 503 });
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const [profile, lessons] = await Promise.all([
    admin
      .from("profiles")
      .select("xp, streak, best_streak, last_active_day, daily_xp, daily_day, claimed")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    admin.from("lesson_progress").select("lesson_id, stars").eq("user_id", user.id),
  ]);
  if (profile.error) return fail(profile.error, "load profile");
  if (lessons.error) return fail(lessons.error, "load lessons");

  const completed = Object.fromEntries((lessons.data ?? []).map((r) => [r.lesson_id as string, r.stars as number]));
  const row = profile.data;

  // A fresh profile with nothing in it may still have progress from before the tables existed.
  if (!row || (row.xp === 0 && Object.keys(completed).length === 0)) {
    const legacy = await legacyProgress(user.id);
    if (legacy) return Response.json({ data: legacy });
    if (!row) return Response.json({ data: null });
  }

  const data: Progress = {
    xp: row!.xp,
    streak: row!.streak,
    bestStreak: row!.best_streak,
    lastActiveDay: row!.last_active_day,
    completed,
    claimed: row!.claimed ?? {},
    daily: { day: row!.daily_day ?? "", xp: row!.daily_xp },
  };
  return Response.json({ data });
}

function validate(input: unknown): Progress | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const p = input as Partial<Progress>;
  const int = (n: unknown, max = 10_000_000) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
  if (!int(p.xp) || !int(p.streak, 100_000) || !int(p.bestStreak, 100_000)) return null;
  if (p.lastActiveDay !== null && !(typeof p.lastActiveDay === "string" && DAY.test(p.lastActiveDay))) return null;
  if (!p.daily || !int(p.daily.xp) || (p.daily.day !== "" && !DAY.test(p.daily.day))) return null;
  if (!p.completed || typeof p.completed !== "object" || !p.claimed || typeof p.claimed !== "object") return null;
  for (const [id, stars] of Object.entries(p.completed)) {
    if (!LESSON_IDS.has(id) || ![1, 2, 3].includes(stars)) return null;
  }
  if (Object.keys(p.claimed).length > 5000 || Object.keys(p.claimed).some((k) => k.length > 80)) return null;
  return p as Progress;
}

export async function PUT(request: Request) {
  const admin = supabaseAdmin();
  if (!admin) return Response.json({ error: "not_configured" }, { status: 503 });
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  let progress: Progress | null = null;
  try {
    progress = validate((JSON.parse(raw) as { data?: unknown }).data);
  } catch {
    // fall through to 400
  }
  if (!progress) return Response.json({ error: "bad_request" }, { status: 400 });

  const { level, title } = levelInfo(progress.xp);
  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    display_name: (user.user_metadata?.display_name as string | undefined) ?? null,
    xp: progress.xp,
    level,
    level_title: title,
    streak: progress.streak,
    best_streak: progress.bestStreak,
    last_active_day: progress.lastActiveDay,
    daily_xp: progress.daily.xp,
    daily_day: progress.daily.day || null,
    claimed: progress.claimed,
    updated_at: new Date().toISOString(),
  });
  if (profileError) return fail(profileError, "save profile");

  const rows = Object.entries(progress.completed).map(([lesson_id, stars]) => ({ user_id: user.id, lesson_id, stars }));
  if (rows.length > 0) {
    const { error } = await admin.from("lesson_progress").upsert(rows, { onConflict: "user_id,lesson_id" });
    if (error) return fail(error, "save lessons");
  }

  return Response.json({ ok: true });
}
