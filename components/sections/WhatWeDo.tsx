import { ArrowRight } from "lucide-react";
import { WHAT_WE_DO } from "@/data/site";
import { OrnamentBand } from "../Ornament";
import { Reveal } from "../Reveal";
import { SectionHeading } from "./SectionHeading";

export function WhatWeDo() {
  return (
    <section
      aria-labelledby="what-title"
      id="what-we-do"
      className="scroll-mt-20 bg-navy-800/40 py-24 sm:py-32"
    >
      <OrnamentBand className="-mt-24 mb-24 text-gold/25 sm:-mt-32 sm:mb-32" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading id="what-title" title={WHAT_WE_DO.title}>
            <p className="mt-7 max-w-4xl font-serif text-2xl leading-snug text-ink/90 sm:text-[2rem] sm:leading-snug">
              {WHAT_WE_DO.intro}
            </p>
          </SectionHeading>
        </Reveal>

        <Reveal delay={0.1} className="mt-16">
          <div className="hidden grid-cols-[1fr_auto_1fr] gap-6 border-b border-white/15 pb-3 text-xs font-semibold tracking-[0.18em] uppercase md:grid">
            <span className="text-faint">{WHAT_WE_DO.problemLabel}</span>
            <span className="w-5" />
            <span className="text-gold">{WHAT_WE_DO.solutionLabel}</span>
          </div>
          <ul>
            {WHAT_WE_DO.items.map((item) => (
              <li
                key={item.problem}
                className="grid gap-2 border-b border-white/10 py-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6"
              >
                <p className="text-lg text-muted">
                  <span className="mr-2 text-xs font-semibold tracking-[0.14em] text-faint uppercase md:hidden">
                    {WHAT_WE_DO.problemLabel}:
                  </span>
                  <span className="decoration-[#e07a6a]/60 decoration-1 md:line-through">
                    {item.problem}
                  </span>
                </p>
                <ArrowRight aria-hidden className="hidden size-5 text-gold md:block" />
                <p className="font-serif text-xl font-semibold text-ink sm:text-2xl">
                  <span className="mr-2 font-sans text-xs font-semibold tracking-[0.14em] text-gold uppercase md:hidden">
                    →
                  </span>
                  {item.solution}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
