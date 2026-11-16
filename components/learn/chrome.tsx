import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LanguageToggle } from "../HeaderActions";

/** Back to the learning path, labelled so it reads as "back" rather than "close". */
export function BackToPath({ href = "/learn" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Хичээлийн зам руу буцах"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
    >
      <ArrowLeft className="size-5" aria-hidden />
      <span className="hidden sm:inline">Буцах</span>
    </Link>
  );
}

/** Top bar for the screens around a lesson (loading, locked, results): back and language. */
export function ScreenBar({ href }: { href?: string }) {
  return (
    <div className="absolute inset-x-0 top-0 mx-auto flex w-full max-w-3xl items-center justify-between px-5 pt-6 sm:px-8">
      <BackToPath href={href} />
      <LanguageToggle />
    </div>
  );
}

/** The soft glow behind every full-screen learning view. */
export function LearnBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute top-[-25%] left-1/2 h-[46rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(79_163_224/0.13),transparent)]" />
      <div className="absolute right-[-20%] bottom-[-35%] h-[40rem] w-[50rem] rounded-full bg-[radial-gradient(closest-side,rgb(232_176_75/0.09),transparent)]" />
    </div>
  );
}
