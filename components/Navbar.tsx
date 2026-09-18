"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HERO, NAV_LINKS } from "@/data/site";
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

        <ul className="hidden items-center gap-8 lg:flex">
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

        <a
          href={HERO.primaryCta.href}
          className="hidden rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:inline-flex"
        >
          {HERO.primaryCta.label}
        </a>

        <button
          type="button"
          className="-mr-2 rounded-lg p-2 text-ink transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-sky-accent lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Цэс хаах" : "Цэс нээх"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </nav>

      {open && (
        <ul id="mobile-nav" className="border-t border-white/10 px-5 py-2 lg:hidden">
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
      )}
    </header>
  );
}
