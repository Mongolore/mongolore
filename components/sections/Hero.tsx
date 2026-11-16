import { ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { ERAS } from "@/data/eras";
import { HERO, HERO_STATS, SITE_NAME_PARTS } from "@/data/site";
import { CountUp } from "../CountUp";
import { TimeGlobe } from "../map/TimeGlobe";
import { Reveal } from "../Reveal";

export function Hero() {
  const [first, second] = SITE_NAME_PARTS;
  const stats = HERO_STATS.map((s) => (s.label === "эрин үе" ? { ...s, value: ERAS.length } : s));
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate -mt-16 overflow-hidden pt-24 pb-16 sm:pt-28 lg:pb-24"
    >
      {/* Night sky: stars, a steppe-dawn glow on the horizon, a cold light behind the globe. */}
      <div aria-hidden className="starfield absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute top-[-10%] right-[-12%] -z-10 h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(closest-side,rgb(79_163_224/0.2),transparent)]"
      />
      <div
        aria-hidden
        className="absolute bottom-[-30%] left-[-15%] -z-10 h-[40rem] w-[60rem] rounded-full bg-[radial-gradient(closest-side,rgb(232_176_75/0.12),transparent)]"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-navy-900" />

      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:items-center lg:gap-12">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-gold-soft uppercase">
            <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-gold" />
            {HERO.eyebrow}
          </p>
          <div className="mt-6 flex items-start gap-5">
            <h1
              id="hero-title"
              data-no-translate
              className="font-serif text-[4.25rem] leading-[0.9] font-bold tracking-tight text-ink sm:text-8xl xl:text-[6.5rem]"
            >
              {first}
              <span className="text-shine mt-2 block font-sans text-[0.52em] leading-none font-extrabold tracking-[0.18em] uppercase">
                {second}
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

          <p className="mt-7 max-w-md font-serif text-2xl leading-snug text-ink/95 sm:text-3xl">{HERO.tagline}</p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">{HERO.subtitle}</p>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-4">
            <Link
              href={HERO.primaryCta.href}
              className="btn-gold group inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 font-semibold text-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {HERO.primaryCta.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link
              href="/learn"
              className="group inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 font-semibold text-ink backdrop-blur transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <GraduationCap className="size-4" aria-hidden />
              {HERO.learnCta}
            </Link>
          </div>

          <dl className="mt-10 flex max-w-md divide-x divide-white/10 border-t border-white/10 pt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex-1 px-4 first:pl-0">
                <dd className="font-serif text-3xl font-bold text-ink sm:text-4xl">
                  <CountUp value={stat.value} />
                  <span className="text-gold">{stat.suffix}</span>
                </dd>
                <dt className="mt-1 text-xs tracking-wide text-faint">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="min-w-0">
          <TimeGlobe />
        </div>
      </div>
    </section>
  );
}
