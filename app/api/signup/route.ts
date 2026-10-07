import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST { name, email, password } → { ok: true }
 *
 * Creates an account that can sign in right away. Accounts are created
 * server-side and pre-confirmed, so learners don't wait for a confirmation
 * email (Supabase's free mailer only sends a few per hour).
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const admin = supabaseAdmin();
  if (!admin) return Response.json({ error: "not_configured" }, { status: 503 });

  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || name.length > 40) return Response.json({ error: "bad_name" }, { status: 400 });
  if (!EMAIL.test(email) || email.length > 200) return Response.json({ error: "bad_email" }, { status: 400 });
  if (password.length < 6 || password.length > 72) return Response.json({ error: "weak_password" }, { status: 400 });

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });

  if (error) {
    if (error.status === 422 || /already|exists|registered/i.test(error.message)) {
      return Response.json({ error: "exists" }, { status: 409 });
    }
    console.error("[signup]", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
