import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ERAS } from "@/data/eras";
import { ERA_STORIES } from "@/data/eraStories";
import { ERA_STRIP } from "@/data/site";
import { Reveal } from "../Reveal";
import { SectionHeading } from "./SectionHeading";

/** One card per era, each opening the full historical map on that era. */
export function EraStrip() {
  return (
    <section aria-labelledby="eras-title" id="eras" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading id="eras-title" title={ERA_STRIP.title}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{ERA_STRIP.intro}</p>
          </SectionHeading>
        </Reveal>
      </div>

      <ol className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 sm:scroll-px-8 sm:px-8 xl:mx-auto xl:max-w-7xl">
        {ERAS.map((era, i) => (
          <li key={era.id} className="w-72 shrink-0 snap-start">
            <Link
              href={`/map?era=${era.id}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-navy-800/80 to-navy-950/60 p-5 transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_20px_40px_-20px_rgb(232_176_75/0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-accent"
            >
              <span
                aria-hidden
                className="absolute -top-4 -right-1 font-serif text-8xl font-bold text-white/[0.04] transition-colors group-hover:text-gold/10"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-xs tracking-wide text-gold">{era.period}</span>
              <span className="mt-2 font-serif text-xl leading-snug font-semibold text-ink">{era.name}</span>
              <span className="mt-1 font-serif text-sm text-gold-soft italic">{ERA_STORIES[era.id]?.hook.title}</span>
              <span className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{era.summary}</span>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-soft group-hover:text-gold-soft">
                {ERA_STRIP.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
