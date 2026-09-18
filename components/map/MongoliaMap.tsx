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
import { AIMAG_EVENTS, AIMAG_INFO_PLACEHOLDER } from "@/data/aimagInfo";
import { HISTORICAL_PINS } from "@/data/historicalPins";
import { MAP_PANEL } from "@/data/site";
import { useMediaQuery } from "@/lib/useMediaQuery";

const DATA_URL = "/data/mongolia-aimags.geojson";
const WIDTH = 800;
const HEIGHT = 440;
// Extra room on the top/left edges for graticule labels.
const EXTENT: [[number, number], [number, number]] = [
  [40, 30],
  [WIDTH - 16, HEIGHT - 20],
];
const SCALE_KM = 400;
const EARTH_RADIUS_KM = 6371;

type RegionFeature = {
  type: "Feature";
  properties: { shapeISO: string; shapeName: string };
  geometry: GeoPermissibleObjects;
};
type RegionCollection = { type: "FeatureCollection"; features: RegionFeature[] };

type ShapedRegion = Region & { d: string; centroid: [number, number] };
type Pointer = { iso: string; x: number; y: number };

function formatDegrees(value: number) {
  return `${Math.abs(value)}°`;
}

export function MongoliaMap() {
  const [data, setData] = useState<RegionCollection | null>(null);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState<Pointer | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    const controller = new AbortController();
    fetch(DATA_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<RegionCollection>;
      })
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Газрын зургийн өгөгдөл ачаалж чадсангүй", err);
        setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const map = useMemo(() => {
    if (!data) return null;
    const projection = geoMercator().fitExtent(
      EXTENT,
      data as unknown as GeoPermissibleObjects,
    );
    const path = geoPath(projection);

    const regions: ShapedRegion[] = [];
    for (const feature of data.features) {
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

    const pins = HISTORICAL_PINS.flatMap((pin) => {
      const point = projection(pin.coordinates);
      return point ? [{ ...pin, x: point[0], y: point[1] }] : [];
    });

    const graticule = path(
      geoGraticule().extent([[70, 30], [135, 60]]).step([5, 5])(),
    ) ?? "";
    const lonLabels = [90, 95, 100, 105, 110, 115, 120].flatMap((lon) => {
      const p = projection([lon, 47]);
      return p && p[0] > EXTENT[0][0] && p[0] < WIDTH - 20 ? [{ v: lon, x: p[0] }] : [];
    });
    const latLabels = [45, 50].flatMap((lat) => {
      const p = projection([100, lat]);
      return p ? [{ v: lat, y: p[1] }] : [];
    });

    const pxPerKm = projection.scale() / EARTH_RADIUS_KM / Math.cos((47 * Math.PI) / 180);
    return {
      regions,
      pins,
      graticule,
      lonLabels,
      latLabels,
      scaleWidth: SCALE_KM * pxPerKm,
    };
  }, [data]);

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

  const details = selectedRegion && (
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
        <p className="mt-2 text-sm leading-relaxed text-muted">{AIMAG_INFO_PLACEHOLDER}</p>
      )}
    </>
  );

  return (
    <figure className="relative overflow-hidden rounded-[18px] border border-white/10 bg-navy-950/50 shadow-[0_30px_80px_-40px_rgb(0_0_0/0.8)]">
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
          aria-label="Монгол Улсын аймгуудын интерактив газрын зураг"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <defs>
            <radialGradient id="map-sea" cx="55%" cy="45%" r="65%">
              <stop offset="0%" stopColor="#4FA3E0" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#4FA3E0" stopOpacity="0" />
            </radialGradient>
            <filter id="region-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#050a18" floodOpacity="0.7" />
            </filter>
            <radialGradient id="pin-core">
              <stop offset="0%" stopColor="#FFF4DA" />
              <stop offset="60%" stopColor="#E8B04B" />
              <stop offset="100%" stopColor="#B7832A" />
            </radialGradient>
          </defs>

          <rect width={WIDTH} height={HEIGHT} fill="url(#map-sea)" pointerEvents="none" />

          {map && (
            <g aria-hidden pointerEvents="none">
              <path d={map.graticule} fill="none" stroke="#8CC6EF" strokeOpacity="0.1" strokeWidth="0.6" strokeDasharray="2 4" />
              {map.lonLabels.map((l) => (
                <text key={l.v} x={l.x} y={17} textAnchor="middle" className="hidden fill-faint font-mono text-[10px] sm:block">
                  {formatDegrees(l.v)}
                </text>
              ))}
              {map.latLabels.map((l) => (
                <text key={l.v} x={10} y={l.y + 3} className="hidden fill-faint font-mono text-[10px] sm:block">
                  {formatDegrees(l.v)}
                </text>
              ))}
            </g>
          )}

          {!data && (
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

          {map && (
            <g aria-hidden className="map-late pointer-events-none">
              {map.pins.map((pin) => (
                <g key={pin.id} transform={`translate(${pin.x} ${pin.y})`}>
                  <circle
                    r={5}
                    fill="none"
                    stroke="#E8B04B"
                    strokeWidth={1.2}
                    className="animate-pin-pulse origin-center [transform-box:fill-box]"
                  />
                  <circle r={3.6} fill="url(#pin-core)" stroke="#16213E" strokeWidth={1} />
                  <text
                    x={pin.x > WIDTH - 110 ? -7 : 7}
                    y={-6}
                    textAnchor={pin.x > WIDTH - 110 ? "end" : "start"}
                    className="map-label hidden fill-gold-soft text-[10px] font-medium sm:block">
                    {pin.name}
                  </text>
                </g>
              ))}

              {/* Compass */}
              <g transform={`translate(${WIDTH - 34} 40)`} className="text-muted">
                <circle r={15} fill="none" stroke="currentColor" strokeOpacity="0.35" />
                <path d="M0 -12 L4 2 L0 0 L-4 2 Z" fill="#E8B04B" />
                <path d="M0 12 L4 -2 L0 0 L-4 -2 Z" fill="currentColor" fillOpacity="0.4" />
                <text y={-19} textAnchor="middle" className="fill-muted text-[10px] font-semibold">
                  {MAP_PANEL.northLabel}
                </text>
              </g>

              {/* Scale bar */}
              <g transform={`translate(44 ${HEIGHT - 26})`} className="hidden sm:block">
                <rect width={map.scaleWidth / 2} height={4} fill="#A9B4C9" />
                <rect x={map.scaleWidth / 2} width={map.scaleWidth / 2} height={4} fill="none" stroke="#A9B4C9" strokeWidth={0.8} />
                <text x={0} y={16} className="hidden fill-faint font-mono text-[10px] sm:block">0</text>
                <text x={map.scaleWidth} y={16} textAnchor="end" className="hidden fill-faint font-mono text-[10px] sm:block">
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

      {/* Footer: legend, or the selected region's details on desktop */}
      <div className="min-h-[76px] border-t border-white/10 px-4 py-3 sm:px-5">
        {isDesktop && selectedRegion ? (
          <div aria-live="polite" aria-label={`${selectedRegion.name} — мэдээлэл`}>
            {details}
          </div>
        ) : (
          <div className="flex h-full flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full bg-gold ring-2 ring-gold/25" />
                {MAP_PANEL.legend.pin}
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-4 rounded-[3px] bg-gold" />
                {MAP_PANEL.legend.selected}
              </li>
            </ul>
            <p className="text-faint">{MAP_PANEL.hint}</p>
          </div>
        )}
      </div>

      {/* Mobile / tablet: bottom sheet */}
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
            {details}
          </motion.aside>
        )}
      </AnimatePresence>
    </figure>
  );
}
