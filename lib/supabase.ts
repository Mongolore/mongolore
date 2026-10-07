import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client, or null when the project isn't configured yet
 * (the site then runs in guest mode with progress kept on this device).
 * Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or
 * the legacy NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local — see .env.example.
 * Sign-up and saving progress go through server routes that also need
 * SUPABASE_SECRET_KEY.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Written out in full: Next.js only inlines NEXT_PUBLIC_ variables it can see literally.
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && key && typeof window !== "undefined" ? createClient(url, key) : null;

export const supabaseConfigured = Boolean(url && key);
