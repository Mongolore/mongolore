import { Download } from "lucide-react";
import type { ReactNode } from "react";
import type { EraDetail } from "@/data/eraDetails";
import type { Era } from "@/data/eras";
import {
  HISTORY_SOURCE,
  HYDRO_SOURCE,
  type EraMap,
  type PlaceKind,
  type Polity,
  type RouteKind,
} from "@/data/historyMaps";
import { FULL_MAP, STORY } from "@/data/site";
import { PlaceSymbol, RouteSwatch } from "./mapSymbols";

type EraDetailsProps = {
  era: Era;
  detail: EraDetail;
  map: EraMap;
  /** Formatted centre and bounds of the map frame, as shown on the map. */
  centre: string;
  bounds: string;
};

const FRONTIER_ORDER = ["north", "south", "east", "west"] as const;
const ROLE_ORDER = ["realm", "ally", "ruler", "other"] as const;

function Section({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/10 pt-6">
      <h2 className="flex items-baseline gap-3 font-serif text-xl font-semibold text-ink sm:text-2xl">
        <span className="font-mono text-xs font-medium text-gold">{String(index).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function PlaceList({ map, kinds }: { map: EraMap; kinds: PlaceKind[] }) {
  const places = map.places.filter((p) => kinds.includes(p.kind));
  if (places.length === 0) return null;
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {places.map((place) => (
        <li key={place.name} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <svg aria-hidden width="16" height="16" viewBox="-8 -8 16 16" className="mt-0.5 shrink-0">
            <PlaceSymbol kind={place.kind} />
          </svg>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">
              {place.name}
              {place.year && <span className="ml-1.5 font-mono text-[11px] text-gold-soft">{place.year}</span>}
            </span>
            <span className="block text-xs text-faint">{place.modern}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function RouteList({ map, kinds }: { map: EraMap; kinds: RouteKind[] }) {
  const routes = (map.routes ?? []).filter((r) => kinds.includes(r.kind));
  if (routes.length === 0) return null;
  return (
    <ul className="mt-4 space-y-1.5">
      {routes.map((route) => (
        <li key={route.label} className="flex items-center gap-3 text-sm text-ink/90">
          <RouteSwatch kind={route.kind} />
          <span>
            {route.label}
            <span className="ml-1.5 text-xs text-faint">· {FULL_MAP.routes[route.kind]}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Every polity labelled on the map, grouped by its role in this era. */
function mapEntities(map: EraMap) {
  const entities: (Polity & { label: string })[] = [];
  for (const polity of Object.values(map.polities)) if (polity.label) entities.push({ ...polity, label: polity.label });
  if (map.derive) {
    for (const polity of [map.derive.inside, map.derive.outside]) {
      if (polity.label) entities.push({ ...polity, label: polity.label });
    }
  }
  if (map.modernRealm) entities.push({ role: "realm", label: map.modernRealm.label });
  return ROLE_ORDER.flatMap((role) => entities.filter((e) => e.role === role));
}

/** The academic deep dive on the era, below the story section. */
export function EraDetails({ era, detail, map, centre, bounds }: EraDetailsProps) {
  const entities = mapEntities(map);

  return (
    <div id="deep-dive" className="mx-auto max-w-7xl scroll-mt-20 px-5 pt-16 pb-20 sm:px-8 lg:pt-20">
      <header className="max-w-3xl border-t border-gold/30 pt-10">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">{STORY.deepDive}</p>
        <p className="mt-2 font-serif text-3xl font-semibold text-ink sm:text-4xl">{era.name}</p>
        <p className="mt-3 text-lg leading-relaxed text-muted">{era.summary}</p>
      </header>

      <div className="mt-10 grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          <Section index={1} title={FULL_MAP.sections.governance}>
            <p>{detail.governance}</p>
          </Section>

          <Section index={2} title={FULL_MAP.sections.territory}>
            <p>{detail.territory}</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {FRONTIER_ORDER.map((side) => (
                <div key={side} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                  <dt className="text-[11px] font-semibold tracking-[0.16em] text-sky-soft uppercase">
                    {FULL_MAP.frontiers[side]}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed">{detail.frontiers[side]}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section index={3} title={FULL_MAP.sections.capital}>
            <p>{detail.capital}</p>
            <PlaceList map={map} kinds={["capital", "ordo", "fortress"]} />
          </Section>

          <Section index={4} title={FULL_MAP.sections.military}>
            <p>{detail.military}</p>
            <RouteList map={map} kinds={["campaign"]} />
            <PlaceList map={map} kinds={["battle"]} />
          </Section>

          <Section index={5} title={FULL_MAP.sections.trade}>
            <p>{detail.trade}</p>
            <RouteList map={map} kinds={["trade", "yam", "journey", "migration"]} />
            <PlaceList map={map} kinds={["city", "monument"]} />
          </Section>

          <Section index={6} title={FULL_MAP.sections.figures}>
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {detail.figures.map((figure) => (
                <li key={figure} className="flex gap-2.5">
                  <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-gold" />
                  {figure}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <aside className="space-y-10">
          <section className="border-t border-white/10 pt-6">
            <h2 className="font-serif text-lg font-semibold text-ink">{FULL_MAP.sections.events}</h2>
            <ol className="mt-4 space-y-3.5">
              {detail.events.map((event) => (
                <li key={`${event.year}-${event.text}`} className="border-l-2 border-gold/50 pl-3">
                  <p className="font-mono text-[11px] text-gold-soft">{event.year}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{event.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {entities.length > 0 && (
            <section className="border-t border-white/10 pt-6">
              <h2 className="font-serif text-lg font-semibold text-ink">{FULL_MAP.sections.neighbours}</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {entities.map((entity) => (
                  <li key={entity.label} className="flex items-center gap-2.5">
                    <svg aria-hidden width="18" height="12" className="shrink-0">
                      <rect x="1" y="1" width="16" height="10" rx="2" className="polity" data-role={entity.role} />
                    </svg>
                    <span className="text-ink/90">{entity.label}</span>
                    <span className="text-xs text-faint">· {FULL_MAP.roles[entity.role]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="border-t border-white/10 pt-6 text-sm text-muted">
            <h2 className="font-serif text-lg font-semibold text-ink">{FULL_MAP.sections.map}</h2>
            <p className="mt-3 leading-relaxed">{map.note}</p>
            <p className="mt-2 text-xs leading-relaxed text-faint">{FULL_MAP.precisionNote}</p>
            <dl className="mt-4 space-y-1.5 font-mono text-[11px] text-faint">
              <div>
                <dt className="inline text-muted">{FULL_MAP.snapshotLabel}: </dt>
                <dd className="inline">{map.snapshot}</dd>
              </div>
              <div>
                <dt className="inline text-muted">{FULL_MAP.centreLabel}: </dt>
                <dd className="inline">{centre}</dd>
              </div>
              <div>
                <dt className="inline text-muted">{FULL_MAP.boundsLabel}: </dt>
                <dd className="inline">{bounds}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs">
              {FULL_MAP.sourceLabel}:{" "}
              <a href={HISTORY_SOURCE.url} target="_blank" rel="noreferrer" className="text-sky-soft underline-offset-2 hover:underline">
                {HISTORY_SOURCE.name}
              </a>{" "}
              ({HISTORY_SOURCE.license}). {FULL_MAP.hydroLabel}:{" "}
              <a href={HYDRO_SOURCE.url} target="_blank" rel="noreferrer" className="text-sky-soft underline-offset-2 hover:underline">
                {HYDRO_SOURCE.name}
              </a>
              .
            </p>
            <a
              href={`/data/history/${era.id}.geojson`}
              download
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-sky-accent"
            >
              <Download className="size-3.5" aria-hidden />
              {FULL_MAP.geojsonLabel}
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
