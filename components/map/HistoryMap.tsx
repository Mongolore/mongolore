"use client";

import { geoGraticule, geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { REGIONS, REGION_KIND_LABEL, type Region } from "@/data/aimags";
import {
  AIMAG_EVENTS,
  AIMAG_INFO_PLACEHOLDER,
  MAP_HISTORICAL_DATA,
} from "@/data/aimagInfo";
import { ERAS } from "@/data/eras";
import { NEIGHBOURS, type NeighbourCode } from "@/data/neighbours";
import { MAP_PANEL } from "@/data/site";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { EraTimeline } from "./EraTimeline";

const AIMAGS_URL = "/data/mongolia-aimags.geojson";
const NEIGHBOURS_URL = "/data/neighbours.geojson";
const OUTLINE_URL = "/data/mongolia-outline.geojson";
const WIDTH = 800;
const HEIGHT = 440;
const EXTENT: [[number, number], [number, number]] = [
  [8, 8],
  [WIDTH - 8, HEIGHT - 8],
];
/**
 * The map is framed on a lon/lat window rather than on Mongolia alone, so the
 * neighbouring countries stay visible around it. Narrow screens use a tighter
 * window, otherwise Mongolia ends up too small to touch.
 */
const VIEW_WINDOWS = {
  wide: { west: 83, south: 38.5, east: 126, north: 55.5 },
  compact: { west: 87, south: 40.5, east: 122, north: 54 },
};

function viewWindow(box: (typeof VIEW_WINDOWS)["wide"]): GeoPermissibleObjects {
  // Clockwise, so d3-geo reads the box as the interior rather than its complement.
  return {
    type: "Polygon",
    coordinates: [
      [
        [box.west, box.south],
        [box.west, box.north],
        [box.east, box.north],
        [box.east, box.south],
        [box.west, box.south],
      ],
    ],
  } as unknown as GeoPermissibleObjects;
}
const SCALE_KM = 400;
const EARTH_RADIUS_KM = 6371;

type GeoFeature<P> = { type: "Feature"; properties: P; geometry: GeoPermissibleObjects };
type Collection<P> = { type: "FeatureCollection"; features: GeoFeature<P>[] };
type AimagProps = { shapeISO: string; shapeName: string };
type NeighbourProps = { ADM0_A3: NeighbourCode };

type ShapedRegion = Region & { d: string; centroid: [number, number] };
type Pointer = { iso: string; x: number; y: number };

export function HistoryMap() {
  const [aimags, setAimags] = useState<Collection<AimagProps> | null>(null);
  const [neighbours, setNeighbours] = useState<Collection<NeighbourProps> | null>(null);
  const [outline, setOutline] = useState<GeoPermissibleObjects | null>(null);
  const [failed, setFailed] = useState(false);
  const [eraIndex, setEraIndex] = useState(ERAS.length - 1);
  const [hovered, setHovered] = useState<Pointer | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isCompact = !useMediaQuery("(min-width: 640px)", true);

  useEffect(() => {
    const controller = new AbortController();
    const load = async <T,>(url: string) => {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return (await res.json()) as T;
    };

    Promise.all([
      load<Collection<AimagProps>>(AIMAGS_URL),
      load<Collection<NeighbourProps>>(NEIGHBOURS_URL),
      load<GeoPermissibleObjects>(OUTLINE_URL),
    ])
      .then(([aimagData, neighbourData, outlineData]) => {
        setAimags(aimagData);
        setNeighbours(neighbourData);
        setOutline(outlineData);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Газрын зургийн өгөгдөл ачаалж чадсангүй", err);
        setFailed(true);
      });

    return () => controller.abort();
  }, []);

  const map = useMemo(() => {
    if (!aimags) return null;
    const projection = geoMercator().fitExtent(
      EXTENT,
      viewWindow(isCompact ? VIEW_WINDOWS.compact : VIEW_WINDOWS.wide),
    );
    const path = geoPath(projection);

    const regions: ShapedRegion[] = [];
    for (const feature of aimags.features) {
      const region = REGIONS[feature.properties.shapeISO];
      if (!region) {
        console.warn(
          `Монгол нэргүй бүс: ${feature.properties.shapeISO} (${feature.properties.shapeName})`,
        );
        continue;
      }
      const geo = feature as unknown as GeoPermissibleObjects;
      regions.push({ ...region, d: path(geo) ?? "", centroid: path.centroid(geo) });
    }
    // Draw the capital last so the small UB shape isn't hidden under Töv.
    regions.sort((a, b) => Number(a.kind === "capital") - Number(b.kind === "capital"));

    const outlinePath = outline ? (path(outline) ?? "") : "";

    const countries = (neighbours?.features ?? []).map((feature) => ({
      code: feature.properties.ADM0_A3,
      d: path(feature as unknown as GeoPermissibleObjects) ?? "",
    }));

    const countryLabels = Object.entries(NEIGHBOURS).flatMap(([code, country]) => {
      if (!country.label) return [];
      const point = projection(country.label);
      return point ? [{ code, name: country.name, x: point[0], y: point[1] }] : [];
    });

    const graticule = path(geoGraticule().extent([[70, 30], [135, 60]]).step([5, 5])()) ?? "";
    const lonLabels = [85, 90, 95, 100, 105, 110, 115, 120, 125].flatMap((lon) => {
      const p = projection([lon, 47]);
      return p && p[0] > 24 && p[0] < WIDTH - 24 ? [{ v: lon, x: p[0] }] : [];
    });
    const latLabels = [40, 45, 50, 55].flatMap((lat) => {
      const p = projection([100, lat]);
      return p && p[1] > 26 && p[1] < HEIGHT - 26 ? [{ v: lat, y: p[1] }] : [];
    });

    const pxPerKm = projection.scale() / EARTH_RADIUS_KM / Math.cos((47 * Math.PI) / 180);

    return {
      projection,
      regions,
      outlinePath,
      countries,
      countryLabels,
      graticule,
      lonLabels,
      latLabels,
      scaleWidth: SCALE_KM * pxPerKm,
    };
  }, [aimags, isCompact, neighbours, outline]);

  const era = ERAS[eraIndex];

  const eraSites = useMemo(() => {
    if (!map) return [];
    return era.sites.flatMap((site) => {
      const point = map.projection(site.coordinates);
      return point ? [{ ...site, x: point[0], y: point[1] }] : [];
    });
  }, [era, map]);

  const eraRegions = useMemo(() => new Set(era.regions), [era]);
  const eraCountries = useMemo(
    () => new Set(era.sites.map((site) => site.country).filter(Boolean)),
    [era],
  );

  const byIso = useMemo(
    () => new Map((map?.regions ?? []).map((r) => [r.iso, r])),
    [map],
  );

  const toggle = useCallback((iso: string) => {
    setSelected((current) => (current === iso ? null : iso));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const onPointerMove = (iso: string, e: PointerEvent<SVGPathElement>) => {
    if (e.pointerType === "touch") return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered({ iso, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onKeyDown = (iso: string, e: KeyboardEvent<SVGPathElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(iso);
    }
  };

  // Tooltip follows the pointer; for keyboard focus it anchors to the centroid.
  const tooltip = (() => {
    if (hovered) return { iso: hovered.iso, left: `${hovered.x}px`, top: `${hovered.y}px` };
    const region = focused ? byIso.get(focused) : undefined;
    if (!region) return null;
    return {
      iso: region.iso,
      left: `${(region.centroid[0] / WIDTH) * 100}%`,
      top: `${(region.centroid[1] / HEIGHT) * 100}%`,
    };
  })();
  const tooltipRegion = tooltip ? byIso.get(tooltip.iso) : undefined;

  const activeIso = hovered?.iso ?? focused;
  const lifted = [activeIso, selected].filter(
    (iso, i, arr): iso is string => !!iso && arr.indexOf(iso) === i,
  );
  const selectedRegion = selected ? byIso.get(selected) : undefined;
  const events = selected ? AIMAG_EVENTS[selected] ?? [] : [];
  // Era-specific history for the selected aimag: MAP_HISTORICAL_DATA[dataKey][numericId].
  // Updates live when the timeline moves while an aimag stays selected.
  const eraHistory = selectedRegion?.numericId
    ? MAP_HISTORICAL_DATA[era.dataKey]?.[selectedRegion.numericId]
    : undefined;

  const regionDetails = selectedRegion && (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
            {REGION_KIND_LABEL[selectedRegion.kind]}
          </p>
          <h3 className="mt-1 font-serif text-2xl font-semibold text-ink">
            {selectedRegion.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="-mr-1.5 rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
          aria-label="Хаах"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {eraHistory && (
        <div className="mt-3 border-l-2 border-gold pl-3">
          <p className="text-xs font-medium text-gold-soft">
            {era.name} · {era.period}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{eraHistory}</p>
        </div>
      )}
      {events.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {events.map((event) => (
            <li key={event.title} className="border-l-2 border-gold/50 pl-3">
              <p className="text-xs font-medium text-sky-soft">{event.period}</p>
              <p className="font-medium text-ink">{event.title}</p>
              <p className="mt-0.5 text-sm text-muted">{event.summary}</p>
            </li>
          ))}
        </ul>
      ) : (
        !eraHistory && (
          <p className="mt-2 text-sm leading-relaxed text-muted">{AIMAG_INFO_PLACEHOLDER}</p>
        )
      )}
    </>
  );

  return (
    <figure className="overflow-hidden rounded-[18px] border border-white/10 bg-navy-950/50 shadow-[0_30px_80px_-40px_rgb(0_0_0/0.8)]">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/10 px-4 py-3 sm:px-5">
        <span>
          <span className="font-serif text-base font-semibold text-ink">{MAP_PANEL.title}</span>
          <span className="ml-2 text-xs text-faint">{MAP_PANEL.meta}</span>
        </span>
        <span className="font-mono text-[11px] tracking-wide text-faint">
          {MAP_PANEL.coordinates}
        </span>
      </figcaption>

      <div ref={stageRef} className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={`block h-auto w-full ${reduceMotion ? "" : "map-animate"}`}
          role="group"
          aria-label="Монгол Улс болон хөрш орнуудын интерактив газрын зураг"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <defs>
            <radialGradient id="map-sea" cx="52%" cy="45%" r="62%">
              <stop offset="0%" stopColor="#4FA3E0" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4FA3E0" stopOpacity="0" />
            </radialGradient>
            <filter id="region-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#050a18" floodOpacity="0.7" />
            </filter>
            <radialGradient id="site-core">
              <stop offset="0%" stopColor="#FFF4DA" />
              <stop offset="60%" stopColor="#E8B04B" />
              <stop offset="100%" stopColor="#B7832A" />
            </radialGradient>
          </defs>

          <rect width={WIDTH} height={HEIGHT} fill="url(#map-sea)" pointerEvents="none" />

          {/* Neighbouring countries, for geographic context */}
          <g aria-hidden pointerEvents="none">
            {map?.countries.map((country) => (
              <path
                key={country.code}
                d={country.d}
                className="neighbour"
                data-active={eraCountries.has(country.code)}
              />
            ))}
            {map?.countryLabels.map((label) => (
              <text
                key={label.code}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                className="map-label hidden fill-faint/70 text-[11px] font-medium tracking-[0.2em] sm:block"
              >
                {label.name}
              </text>
            ))}
          </g>

          {map?.outlinePath && (
            <path
              aria-hidden
              pointerEvents="none"
              d={map.outlinePath}
              fill="#16213e"
              stroke="rgb(140 198 239 / 0.45)"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          )}

          {map && (
            <g aria-hidden pointerEvents="none">
              <path d={map.graticule} fill="none" stroke="#8CC6EF" strokeOpacity="0.08" strokeWidth="0.6" strokeDasharray="2 4" />
              {map.lonLabels.map((l) => (
                <text key={l.v} x={l.x} y={17} textAnchor="middle" className="hidden fill-faint font-mono text-[10px] sm:block">
                  {l.v}°
                </text>
              ))}
              {map.latLabels.map((l) => (
                <text key={l.v} x={10} y={l.y + 3} className="hidden fill-faint font-mono text-[10px] sm:block">
                  {l.v}°
                </text>
              ))}
            </g>
          )}

          {!aimags && (
            <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" className="fill-muted text-[14px]">
              {failed
                ? "Газрын зургийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу."
                : "Газрын зураг ачаалж байна…"}
            </text>
          )}

          <g onPointerLeave={() => setHovered(null)}>
            {map?.regions.map((region, i) => (
              <path
                key={region.iso}
                d={region.d}
                pathLength={1}
                className="region"
                style={{ ["--i" as string]: i }}
                data-active={activeIso === region.iso}
                data-era={eraRegions.has(region.iso)}
                tabIndex={0}
                role="button"
                aria-label={`${region.name} ${REGION_KIND_LABEL[region.kind].toLowerCase()}`}
                aria-pressed={selected === region.iso}
                onPointerMove={(e) => onPointerMove(region.iso, e)}
                onClick={() => toggle(region.iso)}
                onKeyDown={(e) => onKeyDown(region.iso, e)}
                onFocus={(e) => {
                  if (e.currentTarget.matches(":focus-visible")) setFocused(region.iso);
                }}
                onBlur={() => setFocused((f) => (f === region.iso ? null : f))}
              />
            ))}
          </g>

          {/* Lifted copies of the hovered/focused/selected regions, drawn on top */}
          <g aria-hidden>
            {lifted.map((iso) => {
              const region = byIso.get(iso);
              if (!region) return null;
              const isSelected = iso === selected;
              return (
                <path
                  key={`lift-${iso}`}
                  d={region.d}
                  className="region-lift"
                  fill={isSelected ? "#E8B04B" : "#4A66A3"}
                  stroke={isSelected ? "#FBE3B0" : "#D6EAF9"}
                  strokeWidth={1.3}
                  strokeLinejoin="round"
                  filter="url(#region-shadow)"
                />
              );
            })}
          </g>

          {/* Sites of the selected era */}
          <g aria-hidden className="pointer-events-none">
            <AnimatePresence mode="popLayout">
              {eraSites.map((site) => (
                <motion.g
                  key={`${era.id}-${site.name}`}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <g transform={`translate(${site.x} ${site.y})`}>
                  <circle
                    r={5}
                    fill="none"
                    stroke="#E8B04B"
                    strokeWidth={1.2}
                    className="animate-pin-pulse origin-center [transform-box:fill-box]"
                  />
                  <circle r={3.8} fill="url(#site-core)" stroke="#16213E" strokeWidth={1} />
                  <text
                    x={site.x > WIDTH - 120 ? -8 : 8}
                    y={-7}
                    textAnchor={site.x > WIDTH - 120 ? "end" : "start"}
                    className="map-label hidden fill-gold-soft text-[11px] font-semibold sm:block"
                  >
                    {site.name}
                  </text>
                  </g>
                </motion.g>
              ))}
            </AnimatePresence>
          </g>

          {map && (
            <g aria-hidden className="map-late pointer-events-none">
              <g transform={`translate(${WIDTH - 34} 40)`} className="text-muted">
                <circle r={15} fill="none" stroke="currentColor" strokeOpacity="0.35" />
                <path d="M0 -12 L4 2 L0 0 L-4 2 Z" fill="#E8B04B" />
                <path d="M0 12 L4 -2 L0 0 L-4 -2 Z" fill="currentColor" fillOpacity="0.4" />
                <text y={-19} textAnchor="middle" className="fill-muted text-[10px] font-semibold">
                  {MAP_PANEL.northLabel}
                </text>
              </g>

              <g transform={`translate(44 ${HEIGHT - 26})`} className="hidden sm:block">
                <rect width={map.scaleWidth / 2} height={4} fill="#A9B4C9" />
                <rect x={map.scaleWidth / 2} width={map.scaleWidth / 2} height={4} fill="none" stroke="#A9B4C9" strokeWidth={0.8} />
                <text x={0} y={16} className="fill-faint font-mono text-[10px]">0</text>
                <text x={map.scaleWidth} y={16} textAnchor="end" className="fill-faint font-mono text-[10px]">
                  {MAP_PANEL.scaleLabel}
                </text>
              </g>
            </g>
          )}
        </svg>

        {tooltip && tooltipRegion && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-md bg-ink px-2.5 py-1 text-sm font-semibold whitespace-nowrap text-navy-950 shadow-lg shadow-black/40"
            style={{ left: tooltip.left, top: tooltip.top }}
          >
            {tooltipRegion.name}
            {tooltipRegion.kind === "capital" && (
              <span className="ml-1.5 text-xs font-medium text-[#8a5a12]">· Нийслэл</span>
            )}
            <span aria-hidden className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-ink" />
          </div>
        )}
      </div>

      <div className="border-t border-white/10">
        <EraTimeline eras={ERAS} index={eraIndex} onChange={setEraIndex} />
      </div>

      <div className="grid gap-px border-t border-white/10 bg-white/10 lg:grid-cols-2">
        <div aria-live="polite" className="bg-navy-950/80 px-4 py-4 sm:px-5">
          <p className="font-mono text-[11px] tracking-wide text-gold">{era.period}</p>
          <h3 className="mt-1 font-serif text-xl font-semibold text-ink">{era.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{era.summary}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {era.sites.map((site) => (
              <li
                key={site.name}
                className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold-soft"
              >
                {site.name}
                {site.country && (
                  <span className="ml-1 text-faint">· {NEIGHBOURS[site.country].name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-navy-950/80 px-4 py-4 sm:px-5">
          {isDesktop && selectedRegion ? (
            <div aria-label={`${selectedRegion.name} — мэдээлэл`}>{regionDetails}</div>
          ) : (
            <div className="flex h-full flex-col justify-between gap-3">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span aria-hidden className="h-2.5 w-4 rounded-[3px] bg-[#2b5a80]" />
                  {MAP_PANEL.legend.era}
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="size-2 rounded-full bg-gold ring-2 ring-gold/25" />
                  {MAP_PANEL.legend.site}
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="h-2.5 w-4 rounded-[3px] bg-gold" />
                  {MAP_PANEL.legend.selected}
                </li>
              </ul>
              <p className="text-xs text-faint">{MAP_PANEL.hint}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile / tablet: bottom sheet for the selected aimag */}
      <AnimatePresence>
        {!isDesktop && selectedRegion && (
          <motion.aside
            key="info-sheet"
            aria-live="polite"
            aria-label={`${selectedRegion.name} — мэдээлэл`}
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/15 bg-navy-800 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-24px_60px_rgb(0_0_0/0.5)]"
          >
            <div aria-hidden className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/20" />
            {regionDetails}
          </motion.aside>
        )}
      </AnimatePresence>
    </figure>
  );
}
