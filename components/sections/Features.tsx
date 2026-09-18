import { FEATURES, type Feature } from "@/data/features";
import { FEATURES_SECTION } from "@/data/site";
import { Reveal } from "../Reveal";
import { SectionHeading } from "./SectionHeading";

function FeatureCard({ feature }: { feature: Feature }) {
  const { title, description, icon: Icon, implemented } = feature;
  return (
    <article
      className={`flex h-full gap-4 rounded-xl border p-5 transition-colors ${
        implemented
          ? "border-sky-accent/35 bg-sky-accent/[0.06] hover:border-sky-accent/60"
          : "border-white/10 hover:border-white/25"
      }`}
    >
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className={`mt-0.5 size-6 shrink-0 ${implemented ? "text-sky-accent" : "text-sky-soft/70"}`}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-semibold text-ink">{title}</h3>
          {implemented ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[11px] font-semibold text-[#86efac]">
              <span aria-hidden className="size-1.5 rounded-full bg-[#86efac]" />
              {FEATURES_SECTION.availableLabel}
            </span>
          ) : (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-muted">
              {FEATURES_SECTION.soonLabel}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </article>
  );
}

export function Features() {
  // Stable sort: shipped features first, original order otherwise.
  const features = [...FEATURES].sort((a, b) => Number(b.implemented) - Number(a.implemented));

  return (
    <section aria-labelledby="features-title" id="features" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading id="features-title" title={FEATURES_SECTION.title} />
        </Reveal>

        <ul className="mt-14 grid gap-3 md:grid-cols-2">
          {features.map((feature, i) => (
            <li key={feature.id}>
              <Reveal delay={Math.min(i, 5) * 0.04} className="h-full">
                <FeatureCard feature={feature} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
