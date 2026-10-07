import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/data/site";
import { HeaderActions } from "./HeaderActions";
import { Logo } from "./Logo";

/** Sticky header for inner pages (/map, /learn): logo home link, page links, account controls. */
export function PageHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-navy-900/90 backdrop-blur-lg">
      <nav aria-label="Үндсэн цэс" className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={`${SITE_NAME} — нүүр хуудас`}
          className="flex shrink-0 items-center rounded text-lg text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-accent"
        >
          <Logo />
        </Link>
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          {children}
          <HeaderActions />
        </div>
      </nav>
    </header>
  );
}
