import { ArrowDown, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader>
        <a
          href="#details"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
        >
          <span className="hidden sm:inline">{FULL_MAP.toDetails}</span>
          <ArrowDown className="size-4" aria-hidden />
        </a>
        <Link
          href="/learn"
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent md:inline-flex"
        >
          <GraduationCap className="size-4" aria-hidden />
          Суралцах
        </Link>
      </PageHeader>
      <main>
        <FullHistoryMap initialIndex={index === -1 ? 0 : index} />
      </main>
    </div>
  );
}
