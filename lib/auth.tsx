"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, supabaseConfigured } from "./supabase";

export type AuthUser = { id: string; email: string; name: string };

type AuthResult = { error?: string; needsConfirmation?: boolean };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** Opens the login / sign-up dialog from anywhere. */
  dialog: "login" | "signup" | null;
  openDialog: (mode: "login" | "signup") => void;
  closeDialog: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED = "Нэвтрэх систем тохируулагдаагүй байна. .env.local файлд Supabase-ийн түлхүүрээ оруулна уу.";

function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  const email = user.email ?? "";
  const name = (user.user_metadata?.display_name as string | undefined) || email.split("@")[0] || "Суралцагч";
  return { id: user.id, email, name };
}

const SIGNUP_ERRORS: Record<string, string> = {
  exists: "Энэ имэйлээр бүртгэл аль хэдийн үүссэн байна. Нэвтэрнэ үү.",
  bad_email: "Имэйл хаяг буруу байна.",
  bad_name: "Нэрээ оруулна уу (40 тэмдэгтээс бага).",
  weak_password: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.",
  not_configured: NOT_CONFIGURED,
};

/** Supabase's English error messages, in Mongolian. */
function explain(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Имэйл эсвэл нууц үг буруу байна.";
  if (/already registered|already exists/i.test(message)) return "Энэ имэйлээр бүртгэл аль хэдийн үүссэн байна.";
  if (/email not confirmed/i.test(message)) return "Имэйлээ баталгаажуулна уу — шуудангаа шалгаарай.";
  if (/password/i.test(message)) return "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.";
  if (/rate limit/i.test(message)) return "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [dialog, setDialog] = useState<"login" | "signup" | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setUser(toAuthUser(data.session?.user));
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: explain(error.message) } : {};
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: NOT_CONFIGURED };
    // Created server-side and pre-confirmed (app/api/signup), so it works without a confirmation email.
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).catch(() => null);
    if (!res) return { error: "Сүлжээний алдаа. Интернэтээ шалгаад дахин оролдоно уу." };
    if (!res.ok) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: SIGNUP_ERRORS[error ?? ""] ?? "Бүртгэл үүсгэж чадсангүй. Дахин оролдоно уу." };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: explain(error.message) } : {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: supabaseConfigured,
        signIn,
        signUp,
        signOut,
        dialog,
        openDialog: setDialog,
        closeDialog: () => setDialog(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
