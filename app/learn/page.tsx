import { Map as MapIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { DailyQuestion } from "@/components/learn/DailyQuestion";
import { LearnPath } from "@/components/learn/LearnPath";
import { StatsPanel } from "@/components/learn/StatsPanel";
import { SITE_NAME } from "@/data/site";

export const metadata: Metadata = {
  title: `Суралцах — ${SITE_NAME}`,
  description: "Монголын түүхийг богино хичээл, XP, түвшин, өдөр бүрийн цуваагаар тоглоом шиг сур.",
};

export default function LearnPage() {
  return (
    <div>
      <PageHeader>
        <Link
          href="/map"
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent md:inline-flex"
        >
          <MapIcon className="size-4" aria-hidden />
          Газрын зураг
        </Link>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:py-14">
        <main className="min-w-0">
          <header className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Түүхийн аялал</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight font-bold text-ink sm:text-5xl">
              Түүхээ тоглоом шиг сур
            </h1>
            <p className="mt-3 text-lg text-muted">
              Хүннүгээс өнөөг хүртэл — бүлэг бүр 3 богино хичээлтэй. Зөв хариулт бүр XP, алдаа бүр нэг амь. Өдөр бүр
              суралцаж цуваагаа бүү тасал!
            </p>
          </header>

          <div className="mt-8 lg:hidden">
            <StatsPanel compact />
          </div>

          <div className="mt-8">
            <DailyQuestion />
          </div>

          <div className="mt-14">
            <LearnPath />
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <StatsPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
