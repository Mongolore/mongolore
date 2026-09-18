import { ArrowDown } from "lucide-react";
import { HERO, SITE_NAME } from "@/data/site";
import { HistoryMap } from "../map/HistoryMap";
import { Reveal } from "../Reveal";

export function Hero() {
  const [first, ...rest] = SITE_NAME.split(" ");
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden pt-12 pb-20 sm:pt-16 lg:pt-20 lg:pb-28"
    >
      <div
        aria-hidden
        className="absolute top-[-20%] right-[-10%] -z-10 h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(closest-side,rgb(79_163_224/0.13),transparent)]"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,9fr)] lg:items-center lg:gap-14">
        <Reveal>
          <div className="flex items-start gap-5">
            <h1
              id="hero-title"
              className="font-serif text-[4.25rem] leading-[0.9] font-bold tracking-tight text-ink sm:text-8xl xl:text-[6.5rem]"
            >
              {first}
              <span className="mt-2 block font-sans text-[0.52em] leading-none font-extrabold tracking-[0.18em] text-gold">
                {rest.join(" ")}
              </span>
            </h1>
            <span
              aria-hidden
              lang="mn-Mong"
              className="text-script mt-2 text-3xl leading-none text-sky-soft/50 sm:text-4xl"
            >
              {HERO.scriptWord}
            </span>
          </div>

          <p className="mt-8 max-w-md text-lg leading-relaxed text-muted sm:text-xl">
            {HERO.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <a
              href={HERO.primaryCta.href}
              className="group inline-flex items-center gap-2.5 rounded-lg bg-gold px-6 py-3.5 font-semibold text-navy-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)] transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {HERO.primaryCta.label}
              <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
            </a>
            <a
              href={HERO.secondaryCta.href}
              className="border-b border-white/30 pb-0.5 font-medium text-ink transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-accent"
            >
              {HERO.secondaryCta.label}
            </a>
          </div>
        </Reveal>

        {/* Not wrapped in a transformed element so the mobile bottom sheet stays viewport-fixed. */}
        <div id="map" className="min-w-0 scroll-mt-24">
          <HistoryMap />
        </div>
      </div>
    </section>
  );
}
