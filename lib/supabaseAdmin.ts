import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the secret key. Import it from route
 * handlers only — never from a "use client" file, or the key ships to
 * browsers.
 */

let admin: SupabaseClient | null | undefined;

export function supabaseAdmin(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  admin = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return admin;
}

/** The signed-in user behind a request's `Authorization: Bearer <access token>`, or null. */
export async function userFromRequest(request: Request): Promise<User | null> {
  const client = supabaseAdmin();
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!client || !token) return null;
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}
