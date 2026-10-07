"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame, Loader2, MailCheck, Trophy, X, Zap } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";

const input =
  "w-full rounded-xl border border-white/15 bg-navy-950/70 px-4 py-3 text-ink placeholder:text-faint transition focus:border-gold/70 focus:outline-none focus:ring-2 focus:ring-gold/20";

export function AuthDialog() {
  const { dialog, openDialog, closeDialog, signIn, signUp, configured } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);
  const mode = dialog ?? "login";

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDialog();
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => firstField.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [dialog, closeDialog]);

  const switchMode = (next: "login" | "signup") => {
    setError(null);
    setConfirmSent(false);
    openDialog(next);
  };

  const close = () => {
    setError(null);
    setConfirmSent(false);
    setPassword("");
    closeDialog();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result =
      mode === "signup" ? await signUp(name.trim(), email.trim(), password) : await signIn(email.trim(), password);
    setBusy(false);
    if (result.error) setError(result.error);
    else if (result.needsConfirmation) setConfirmSent(true);
    else close();
  };

  return (
    <AnimatePresence>
      {dialog && (
        <motion.div
          key="auth"
          className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-navy-950/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-navy-900 shadow-2xl"
          >
            <div className="relative bg-[radial-gradient(120%_100%_at_0%_0%,rgb(232_176_75/0.22),transparent_60%)] px-7 pt-7 pb-5">
              <button
                type="button"
                onClick={close}
                aria-label="Хаах"
                className="absolute top-4 right-4 rounded-full p-2 text-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
              >
                <X className="size-5" aria-hidden />
              </button>
              <Logo className="text-base" />
              <h2 id="auth-title" className="mt-5 font-serif text-3xl font-bold text-ink">
                {mode === "signup" ? "Аяллаа эхлүүлье" : "Тавтай морил!"}
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                {mode === "signup"
                  ? "Бүртгүүлээд XP, цуваа, түвшингээ бүх төхөөрөмж дээрээ хадгал."
                  : "Нэвтэрч ахицаа үргэлжлүүлээрэй."}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                <li className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-gold-soft">
                  <Zap className="size-3.5" aria-hidden /> XP цуглуул
                </li>
                <li className="flex items-center gap-1 rounded-full bg-orange-400/15 px-2.5 py-1 text-orange-200">
                  <Flame className="size-3.5" aria-hidden /> Өдөр бүрийн цуваа
                </li>
                <li className="flex items-center gap-1 rounded-full bg-sky-accent/15 px-2.5 py-1 text-sky-soft">
                  <Trophy className="size-3.5" aria-hidden /> Түвшин ахи
                </li>
              </ul>
            </div>

            {confirmSent ? (
              <div className="px-7 pt-2 pb-8 text-center">
                <MailCheck className="mx-auto size-12 text-emerald-300" aria-hidden />
                <p className="mt-3 font-semibold text-ink">Имэйлээ шалгаарай</p>
                <p className="mt-1 text-sm text-muted">
                  {email} хаяг руу баталгаажуулах холбоос илгээлээ. Холбоос дээр дарсны дараа нэвтэрнэ үү.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="mt-5 rounded-xl bg-gold px-5 py-2.5 font-semibold text-navy-950 hover:bg-gold-soft"
                >
                  Нэвтрэх
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3 px-7 pt-2 pb-7">
                {!configured && (
                  <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
                    Нэвтрэх систем хараахан тохируулагдаагүй. Тэр хүртэл таны ахиц энэ төхөөрөмж дээр хадгалагдана.
                  </p>
                )}
                {mode === "signup" && (
                  <input
                    ref={firstField}
                    className={input}
                    placeholder="Таны нэр"
                    autoComplete="nickname"
                    required
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
                <input
                  ref={mode === "login" ? firstField : undefined}
                  className={input}
                  type="email"
                  placeholder="Имэйл"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className={input}
                  type="password"
                  placeholder="Нууц үг (6+ тэмдэгт)"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                  <p role="alert" className="text-sm text-rose-300">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 font-bold text-navy-950 shadow-[0_4px_0_#a87a23] transition hover:bg-gold-soft active:translate-y-0.5 active:shadow-[0_2px_0_#a87a23] disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {mode === "signup" ? "Бүртгүүлэх" : "Нэвтрэх"}
                </button>
                <p className="pt-1 text-center text-sm text-muted">
                  {mode === "signup" ? "Бүртгэлтэй юу?" : "Шинэ хэрэглэгч үү?"}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
                    className="font-semibold text-gold hover:text-gold-soft"
                  >
                    {mode === "signup" ? "Нэвтрэх" : "Бүртгүүлэх"}
                  </button>
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
