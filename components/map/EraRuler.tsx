import { FEATURES } from "@/data/features";
import { ERA_RULER, FEATURES_SECTION } from "@/data/site";

export function EraRuler() {
  const ready = FEATURES.find((f) => f.id === ERA_RULER.featureId)?.implemented ?? false;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="font-medium text-muted">{ERA_RULER.title}</p>
        <span className={ready ? "text-[#86efac]" : "text-faint"}>
          {ready ? FEATURES_SECTION.availableLabel : FEATURES_SECTION.soonLabel}
        </span>
      </div>
      <div className="-mx-5 mt-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <ol className="relative flex min-w-[640px] justify-between">
          <span aria-hidden className="absolute top-[5px] right-0 left-0 h-px bg-gradient-to-r from-gold/70 via-white/20 to-sky-accent/60" />
          {ERA_RULER.eras.map((era, i) => (
            <li key={era.year} className="relative flex w-20 flex-col items-center text-center first:items-start first:text-left last:items-end last:text-right">
              <span
                aria-hidden
                className={`size-[11px] rounded-full border-2 ${
                  i === 0 || i === ERA_RULER.eras.length - 1
                    ? "border-gold bg-navy-900"
                    : "border-white/30 bg-navy-900"
                }`}
              />
              <span className="mt-2 font-serif text-sm font-semibold text-ink tabular-nums">{era.year}</span>
              <span className="mt-0.5 text-[11px] leading-tight text-faint">{era.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
