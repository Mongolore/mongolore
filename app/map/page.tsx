import { ArrowDown, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FullHistoryMap } from "@/components/map/FullHistoryMap";
import { ERAS } from "@/data/eras";
import { FULL_MAP, SITE_NAME } from "@/data/site";

export const metadata: Metadata = {
  title: `${FULL_MAP.title} — ${SITE_NAME}`,
  description: FULL_MAP.description,
};

/** Full-screen historical map: the map first, the era's details below it. `?era=<id>` picks the era. */
export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { era } = await searchParams;
  const index = ERAS.findIndex((e) => e.id === era);

  return (
    <div>
      <a
        href="#details"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-navy-950"
      >
        {FULL_MAP.toDetails}
      </a>
      <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-navy-900/90 backdrop-blur-lg">
        <nav aria-label="Үндсэн цэс" className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            aria-label={`${SITE_NAME} — ${FULL_MAP.home}`}
            className="flex items-center rounded text-lg text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-accent"
          >
            <Logo />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href="#details"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
            >
              {FULL_MAP.toDetails}
              <ArrowDown className="size-4" aria-hidden />
            </a>
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent sm:inline-flex"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {FULL_MAP.home}
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <FullHistoryMap initialIndex={index === -1 ? 0 : index} />
      </main>
    </div>
  );
}
