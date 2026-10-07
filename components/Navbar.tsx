"use client";

import { GraduationCap, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/data/site";
import { HeaderActions } from "./HeaderActions";
import { Logo } from "./Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color] duration-300 ${
        solid
          ? "border-b border-white/10 bg-navy-900/85 backdrop-blur-lg backdrop-saturate-150"
          : "border-b border-transparent"
      }`}
    >
      <nav
        aria-label="Үндсэн цэс"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8"
      >
        <a
          href="#top"
          className="flex items-center rounded text-lg text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-accent"
          aria-label="ТҮҮХ MAP — нүүр хуудас"
        >
          <Logo />
        </a>

        <ul className="hidden items-center gap-7 xl:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="relative py-1 text-sm text-muted transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:text-ink hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-accent"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/learn"
            className="hidden items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-soft transition hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-gold xl:inline-flex"
          >
            <GraduationCap className="size-4" aria-hidden />
            Суралцах
          </Link>
          <div className="hidden sm:block">
            <HeaderActions />
          </div>
          <button
            type="button"
            className="-mr-2 rounded-lg p-2 text-ink transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-sky-accent xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Цэс хаах" : "Цэс нээх"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-white/10 px-5 py-2 xl:hidden">
          <ul>
            <li className="border-b border-white/5">
              <Link href="/learn" onClick={() => setOpen(false)} className="flex items-center gap-2 py-3.5 font-serif text-lg text-gold-soft">
                <GraduationCap className="size-5" aria-hidden />
                Суралцах
              </Link>
            </li>
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="border-b border-white/5 last:border-0">
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3.5 font-serif text-lg text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="py-3 sm:hidden">
            <HeaderActions />
          </div>
        </div>
      )}
    </header>
  );
}
