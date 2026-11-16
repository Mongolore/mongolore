import { AIMAG_SECTION } from "@/data/site";
import { HistoryMap } from "../map/HistoryMap";
import { Reveal } from "../Reveal";
import { SectionHeading } from "./SectionHeading";

/** Today's 21 aimags over the borders of whichever era the timeline is on. */
export function AimagExplorer() {
  return (
    <section aria-labelledby="aimag-title" id="map" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">{AIMAG_SECTION.eyebrow}</p>
          <div className="mt-3">
            <SectionHeading id="aimag-title" title={AIMAG_SECTION.title}>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{AIMAG_SECTION.intro}</p>
            </SectionHeading>
          </div>
        </Reveal>

        {/* Not wrapped in a transformed element so the mobile bottom sheet stays viewport-fixed. */}
        <div className="mx-auto mt-10 max-w-5xl">
          <HistoryMap />
        </div>
      </div>
    </section>
  );
}
