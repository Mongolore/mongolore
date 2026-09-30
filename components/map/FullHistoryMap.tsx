"use client";

import {
  geoConicEqualArea,
  geoDistance,
  geoGraticule,
  geoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
} from "d3-geo";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ERA_DETAILS } from "@/data/eraDetails";
import { ERAS } from "@/data/eras";
import { ERA_STORIES } from "@/data/eraStories";
import {
  ERA_MAPS,
  HISTORY_SOURCE,
  HYDRO_SOURCE,
  LANDFORMS,
  type EraMap,
  type LonLat,
  type PlaceKind,
  type PolityRole,
  type RouteKind,
  type ViewWindow,
} from "@/data/historyMaps";
import { FULL_MAP, STORY } from "@/data/site";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { EraDetails } from "./EraDetails";
import { EraStory } from "./EraStory";
import { EraTimeline } from "./EraTimeline";
import { PlaceSymbol, RouteSwatch } from "./mapSymbols";

const HYDRO_URL = "/data/history/hydro.geojson";
const OUTLINE_URL = "/data/mongolia-outline.geojson";
const eraUrl = (id: string) => `/data/history/${id}.geojson`;

/** Padding between the era's view window and the edge of the map. */
const PAD = 28;
const MIN_HEIGHT = 360;
const HEADER_HEIGHT = 64;
/** Landforms crowd the Mongolian plateau on continent-wide views. */
const LANDFORM_MAX_SPAN = 100;
const EARTH_RADIUS_KM = 6371;

type Role = PolityRole | "land";
type PolityProps = { name: string | null; role: Role; label?: string; labelAt?: LonLat };
type HydroProps = { kind: "river" | "lake" | "river-label"; label?: string };
type GeoFeature<P> = { type: "Feature"; properties: P; geometry: GeoPermissibleObjects };
type Collection<P> = { type: "FeatureCollection"; features: GeoFeature<P>[] };

type Box = { x0: number; y0: number; x1: number; y1: number };
type Label = {
  key: string;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  className: string;
};
type Tip = { x: number; y: number; eyebrow: string; title: string; body?: string };

const ROLE_ORDER: Role[] = ["land", "other", "ruler", "ally", "realm"];
const PLACE_PRIORITY: PlaceKind[] = ["capital", "ordo", "battle", "fortress", "city", "monument"];
const ROUTE_ORDER: RouteKind[] = ["trade", "yam", "migration", "journey", "campaign"];

/** The view window's outline, densified so a conic projection fits its curved edges. */
function frameOf(v: ViewWindow): GeoPermissibleObjects {
  const points: LonLat[] = [];
  for (let lon = v.west; lon < v.east; lon += 2) points.push([lon, v.south], [lon, v.north]);
  for (let lat = v.south; lat < v.north; lat += 2) points.push([v.west, lat], [v.east, lat]);
  points.push([v.east, v.south], [v.east, v.north]);
  return { type: "MultiPoint", coordinates: points } as GeoPermissibleObjects;
}

/** Equal-area, so empires are compared at their true size. */
function projectionFor(v: ViewWindow): GeoProjection {
  const span = v.north - v.south;
  return geoConicEqualArea()
    .rotate([-(v.west + v.east) / 2, 0])
    .parallels([v.south + span / 6, v.north - span / 6]);
}

/** Rough text extent; good enough to keep labels from piling up. */
function textBox(x: number, y: number, text: string, size: number, anchor: Label["anchor"], widthFactor = 0.56): Box {
  const w = text.length * size * widthFactor;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return { x0: x0 - 2, y0: y - size * 0.85, x1: x0 + w + 2, y1: y + size * 0.3 };
}

const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

function niceScale(kmPer100px: number) {
  const target = kmPer100px * 1.3;
  return [100, 200, 250, 500, 1000, 2000].reduce((best, km) =>
    Math.abs(km - target) < Math.abs(best - target) ? km : best,
  );
}

function formatDegrees(a: number, b: number) {
  return a === b ? `${a}°` : `${a}–${b}°`;
}

function useLoader() {
  const [hydro, setHydro] = useState<Collection<HydroProps> | null>(null);
  const [outline, setOutline] = useState<GeoPermissibleObjects | null>(null);
  const [eras, setEras] = useState<Record<string, Collection<PolityProps>>>({});
  const [failed, setFailed] = useState(false);
  const requested = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(HYDRO_URL, { signal: controller.signal }).then((r) => r.json()),
      fetch(OUTLINE_URL, { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(([h, o]) => {
        setHydro(h);
        setOutline(o);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) console.error("Гол мөрний өгөгдөл ачаалж чадсангүй", err);
      });
    return () => controller.abort();
  }, []);

  const load = useCallback((id: string) => {
    if (requested.current.has(id)) return;
    requested.current.add(id);
    fetch(eraUrl(id))
      .then((res) => {
        if (!res.ok) throw new Error(`${eraUrl(id)}: HTTP ${res.status}`);
        return res.json() as Promise<Collection<PolityProps>>;
      })
      .then((data) => setEras((current) => ({ ...current, [id]: data })))
      .catch((err: unknown) => {
        console.error("Газрын зургийн өгөгдөл ачаалж чадсангүй", err);
        requested.current.delete(id);
        setFailed(true);
      });
  }, []);

  return { hydro, outline, eras, failed, load };
}

/** Width of the map, and the height left for it under the header and above the timeline. */
function useStageSize(stageRef: RefObject<HTMLDivElement | null>, timelineRef: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<{ width: number; maxHeight: number } | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      const timeline = timelineRef.current?.offsetHeight ?? 0;
      const width = stage.clientWidth;
      const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - HEADER_HEIGHT - timeline);
      setSize((s) => (s && s.width === width && s.maxHeight === maxHeight ? s : { width, maxHeight }));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    if (timelineRef.current) observer.observe(timelineRef.current);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [stageRef, timelineRef]);

  return size;
}

function polityLabels(map: EraMap, features: GeoFeature<PolityProps>[], outline: GeoPermissibleObjects | null) {
  const labels: { text: string; at: LonLat; role: Role }[] = [];
  for (const f of features) {
    if (f.properties.label && f.properties.labelAt) {
      labels.push({ text: f.properties.label, at: f.properties.labelAt, role: f.properties.role });
    }
  }
  if (map.modernRealm && outline) {
    const at = map.modernRealm.labelAt ?? ([103.5, 46.6] as LonLat);
    labels.push({ text: map.modernRealm.label, at, role: "realm" });
  }
  return labels.sort((a, b) => ROLE_ORDER.indexOf(b.role) - ROLE_ORDER.indexOf(a.role));
}

export function FullHistoryMap({ initialIndex }: { initialIndex: number }) {
  const [eraIndex, setEraIndex] = useState(initialIndex);
  const [hiddenRoutes, setHiddenRoutes] = useState<Set<RouteKind>>(() => new Set());
  const [legendOpen, setLegendOpen] = useState<boolean | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [activeRoute, setActiveRoute] = useState<number | null>(null);
  // The open hotspot card, remembered per era so switching eras closes it.
  const [openHotspot, setOpenHotspot] = useState<{ era: string; index: number } | null>(null);
  const hotspotRefs = useRef<(SVGGElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const size = useStageSize(stageRef, timelineRef);
  const { hydro, outline, eras: loaded, failed, load } = useLoader();

  const era = ERAS[eraIndex];
  const config = ERA_MAPS[era.id];
  const detail = ERA_DETAILS[era.id];
  const story = ERA_STORIES[era.id];
  // Keep showing the last loaded era while the next one downloads, so the
  // map never pairs one era's borders with another's frame.
  const [shownId, setShownId] = useState(era.id);
  if (loaded[era.id] && shownId !== era.id) setShownId(era.id);
  const mapId = loaded[era.id] ? era.id : shownId;
  const mapConfig = ERA_MAPS[mapId];
  const data = loaded[mapId];

  useEffect(() => {
    load(era.id);
    // Warm the neighbours so dragging the timeline doesn't wait on the network.
    for (const i of [eraIndex - 1, eraIndex + 1]) if (ERAS[i]) load(ERAS[i].id);
  }, [era.id, eraIndex, load]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("era", era.id);
    window.history.replaceState(window.history.state, "", url);
  }, [era.id]);

  const map = useMemo(() => {
    if (!size || size.width === 0 || !data) return null;
    const drawn = mapConfig;
    const frame = frameOf(drawn.view);
    const projection = projectionFor(drawn.view).fitExtent(
      [[PAD, PAD], [size.width - PAD, size.maxHeight - PAD]],
      frame,
    );
    // On a portrait screen the window fills the width long before the height;
    // shrink the map to the window instead of padding it with empty sea.
    const [[, top], [, bottom]] = geoPath(projection).bounds(frame);
    const height = Math.round(Math.min(size.maxHeight, (bottom - top) * 1.15 + 2 * PAD));
    projection.fitExtent([[PAD, PAD], [size.width - PAD, height - PAD]], frame);
    const path = geoPath(projection);
    const width = size.width;
    const inside = ([x, y]: [number, number]) => x > 4 && x < width - 4 && y > 4 && y < height - 4;

    const polities = data.features
      .map((f, i) => ({ key: `${f.properties.name}-${i}`, role: f.properties.role, d: path(f.geometry) ?? "" }))
      .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
    const modernRealm = drawn.modernRealm && outline ? (path(outline) ?? "") : "";

    const rivers: string[] = [];
    const lakes: string[] = [];
    const riverLabels: { text: string; at: LonLat }[] = [];
    for (const f of hydro?.features ?? []) {
      if (f.properties.kind === "river") rivers.push(path(f.geometry) ?? "");
      else if (f.properties.kind === "lake") lakes.push(path(f.geometry) ?? "");
      else if (f.properties.label) {
        riverLabels.push({ text: f.properties.label, at: (f.geometry as unknown as { coordinates: LonLat }).coordinates });
      }
    }

    const routes = (drawn.routes ?? []).map((route, i) => ({
      ...route,
      i,
      d: path({ type: "LineString", coordinates: route.path } as GeoPermissibleObjects) ?? "",
    }));

    const places = drawn.places
      .map((place, i) => {
        const p = projection(place.at);
        return p ? { ...place, i, x: p[0], y: p[1] } : null;
      })
      .filter((p): p is NonNullable<typeof p> => !!p && inside([p.x, p.y]));

    // Labels, most important first; each is dropped if it would cover one
    // already placed. Symbols are reserved up front so no label hides one.
    const taken: Box[] = places.map((p) => ({ x0: p.x - 7, y0: p.y - 7, x1: p.x + 7, y1: p.y + 7 }));

    // Story hotspots: a numbered badge just above the place they belong to,
    // or on their own point. Reserved before labels so none hides a badge.
    const hotspots = (ERA_STORIES[mapId]?.hotspots ?? []).flatMap((hotspot, i) => {
      const place = hotspot.place ? drawn.places.find((p) => p.name === hotspot.place) : undefined;
      const at = place?.at ?? hotspot.at;
      const p = at && projection(at);
      if (!p || !inside(p)) return [];
      const [x, y] = place ? [p[0], p[1] - 17] : p;
      taken.push({ x0: x - 11, y0: y - 11, x1: x + 11, y1: y + 11 });
      return [{ ...hotspot, i, x, y }];
    });
    const labels: Label[] = [];
    const tryPlace = (label: Label, size: number, widthFactor?: number) => {
      const box = textBox(label.x, label.y, label.text, size, label.anchor, widthFactor);
      if (box.x0 < 2 || box.x1 > width - 2 || box.y0 < 2 || box.y1 > height - 2) return false;
      if (taken.some((t) => overlaps(t, box))) return false;
      taken.push(box);
      labels.push(label);
      return true;
    };

    const polityText = polityLabels(drawn, data.features, outline);
    const realmLabels = polityText.filter((l) => l.role === "realm");
    const otherLabels = polityText.filter((l) => l.role !== "realm");
    const placePolity = (l: (typeof polityText)[number], i: number) => {
      const p = projection(l.at);
      if (!p || !inside(p)) return;
      const realm = l.role === "realm";
      // Nudge up or down when a symbol sits on the label's spot.
      for (const dy of [0, 16, -16, 30, -30]) {
        const placed = tryPlace(
          {
            key: `polity-${i}-${l.text}`,
            text: realm ? l.text.toUpperCase() : l.text,
            x: p[0],
            y: p[1] + dy,
            anchor: "middle",
            className: `polity-label polity-label-${l.role}`,
          },
          realm ? 14 : 11.5,
          realm ? 0.74 : 0.6,
        );
        if (placed) break;
      }
    };
    realmLabels.forEach(placePolity);

    const byPriority = [...places].sort(
      (a, b) => PLACE_PRIORITY.indexOf(a.kind) - PLACE_PRIORITY.indexOf(b.kind),
    );
    for (const place of byPriority) {
      const candidates: [number, number, Label["anchor"]][] = [
        [place.x + 9, place.y + 4, "start"],
        [place.x - 9, place.y + 4, "end"],
        [place.x, place.y - 10, "middle"],
        [place.x, place.y + 17, "middle"],
      ];
      for (const [x, y, anchor] of candidates) {
        const placed = tryPlace(
          { key: `place-${place.i}`, text: place.name, x, y, anchor, className: `place-label place-label-${place.kind}` },
          11.5,
        );
        if (placed) break;
      }
    }

    otherLabels.forEach((l, i) => placePolity(l, i + realmLabels.length));

    (drawn.regionLabels ?? []).forEach((r, i) => {
      const p = projection(r.at);
      if (p && inside(p)) {
        tryPlace({ key: `region-${i}`, text: r.label, x: p[0], y: p[1], anchor: "middle", className: "region-label" }, 11);
      }
    });

    riverLabels.forEach((r, i) => {
      const p = projection(r.at);
      if (p && inside(p)) {
        tryPlace({ key: `river-${i}`, text: r.text, x: p[0] + 4, y: p[1] - 4, anchor: "start", className: "river-label" }, 10);
      }
    });

    if (drawn.view.east - drawn.view.west <= LANDFORM_MAX_SPAN) {
      LANDFORMS.forEach((l, i) => {
        const p = projection(l.at);
        if (p && inside(p)) {
          tryPlace(
            { key: `landform-${i}`, text: l.label, x: p[0], y: p[1], anchor: "middle", className: `landform-label landform-${l.kind}` },
            10.5,
            0.66,
          );
        }
      });
    }

    const graticule = path(geoGraticule().step([10, 10])()) ?? "";

    // Scale bar measured across the middle of the map, where distortion is least.
    const a = projection.invert?.([width / 2 - 50, height / 2]);
    const b = projection.invert?.([width / 2 + 50, height / 2]);
    const kmPer100 = a && b ? geoDistance(a, b) * EARTH_RADIUS_KM : 0;
    const scaleKm = kmPer100 ? niceScale(kmPer100) : 0;

    return {
      width,
      height,
      polities,
      modernRealm,
      rivers,
      lakes,
      routes,
      places,
      hotspots,
      labels,
      graticule,
      scaleKm,
      scaleWidth: kmPer100 ? (scaleKm / kmPer100) * 100 : 0,
      roles: new Set(polities.map((p) => p.role).concat(modernRealm ? ["realm"] : [])),
    };
  }, [size, data, mapId, mapConfig, outline, hydro]);

  const openIndex = openHotspot?.era === mapId ? openHotspot.index : null;
  const openCard = openIndex !== null ? map?.hotspots.find((h) => h.i === openIndex) : undefined;
  const hotspotCount = story.hotspots.length;

  const closeHotspot = useCallback(() => {
    const index = openHotspot?.index;
    setOpenHotspot(null);
    if (index !== undefined) hotspotRefs.current[index]?.focus();
  }, [openHotspot]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") closeHotspot();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, closeHotspot]);

  useEffect(() => {
    if (openIndex !== null) cardRef.current?.focus({ preventScroll: true });
  }, [openIndex]);

  const showHotspot = (index: number) => {
    setTip(null);
    setOpenHotspot({ era: era.id, index });
  };

  const showHotspotFromStory = (index: number) => {
    sectionRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    showHotspot(index);
  };

  const routeKinds = ROUTE_ORDER.filter((kind) => config.routes?.some((r) => r.kind === kind));
  const placeKinds = PLACE_PRIORITY.filter((kind) => config.places.some((p) => p.kind === kind));
  const showLegend = legendOpen ?? (size ? size.width >= 640 : false);

  const toggleRoute = (kind: RouteKind) =>
    setHiddenRoutes((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  const { view } = config;
  const centre = `${Math.round((view.south + view.north) / 2)}° х.ө. · ${Math.round((view.west + view.east) / 2)}° з.у.`;
  const bounds = `${formatDegrees(view.south, view.north)} х.ө. · ${formatDegrees(view.west, view.east)} з.у.`;

  const tipFromPoint = (x: number, y: number, eyebrow: string, title: string, body?: string) =>
    setTip({ x, y, eyebrow, title, body });

  return (
    <>
      <section ref={sectionRef} aria-labelledby="map-title" className="relative scroll-mt-16">
        <div
          ref={stageRef}
          className="relative w-full overflow-hidden bg-[#0b1327]"
          style={{ height: map?.height ?? `calc(100svh - ${HEADER_HEIGHT}px - 8.5rem)` }}
        >
          {map ? (
            <svg
              width={map.width}
              height={map.height}
              viewBox={`0 0 ${map.width} ${map.height}`}
              className="block"
              role="group"
              aria-labelledby="map-title"
              aria-describedby="map-desc"
              onPointerLeave={() => {
                setTip(null);
                setActiveRoute(null);
              }}
            >
              <desc id="map-desc">{mapConfig.note}</desc>
              <defs>
                <pattern id="ally-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="#1f2d50" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#E8B04B" strokeOpacity="0.5" strokeWidth="1.6" />
                </pattern>
                <marker id="arrow-campaign" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 1 9 5 0 9Z" fill="#E0654F" />
                </marker>
                <marker id="arrow-migration" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 1 9 5 0 9Z" fill="#8CC6EF" />
                </marker>
                <marker id="arrow-journey" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 1 9 5 0 9Z" fill="#C4A0E8" />
                </marker>
              </defs>

              <path d={map.graticule} fill="none" stroke="#8CC6EF" strokeOpacity="0.07" strokeWidth="0.6" />

              <g key={mapId} className="era-fade">
                {map.polities.map((p) => (
                  <path key={p.key} d={p.d} className="polity" data-role={p.role} />
                ))}
                {map.modernRealm && <path d={map.modernRealm} className="polity" data-role="realm" />}
              </g>

              <g aria-hidden pointerEvents="none">
                {map.lakes.map((d, i) => (
                  <path key={i} d={d} fill="#1d4a72" stroke="#4FA3E0" strokeOpacity="0.5" strokeWidth="0.5" />
                ))}
                {map.rivers.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#4FA3E0" strokeOpacity="0.5" strokeWidth="0.8" strokeLinecap="round" />
                ))}
              </g>

              <g>
                {map.routes.map((route) =>
                  hiddenRoutes.has(route.kind) ? null : (
                    <g key={`${mapId}-route-${route.i}`}>
                      <path
                        d={route.d}
                        className={`route route-${route.kind}`}
                        data-active={activeRoute === route.i}
                        markerEnd={
                          route.kind === "campaign" || route.kind === "migration" || route.kind === "journey"
                            ? `url(#arrow-${route.kind})`
                            : undefined
                        }
                      />
                      <path
                        d={route.d}
                        className="route-hit"
                        onPointerMove={(e) => {
                          if (e.pointerType === "touch") return;
                          const rect = stageRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          setActiveRoute(route.i);
                          tipFromPoint(e.clientX - rect.left, e.clientY - rect.top, FULL_MAP.routes[route.kind], route.label);
                        }}
                        onPointerLeave={() => {
                          setActiveRoute(null);
                          setTip(null);
                        }}
                      />
                    </g>
                  ),
                )}
              </g>

              <g>
                {map.places.map((place) => {
                  const eyebrow = FULL_MAP.places[place.kind] + (place.year ? ` · ${place.year}` : "");
                  const show = () => tipFromPoint(place.x, place.y - 6, eyebrow, place.name, place.modern);
                  return (
                    <g
                      key={`${mapId}-place-${place.i}`}
                      transform={`translate(${place.x} ${place.y})`}
                      className="place"
                      tabIndex={0}
                      role="img"
                      aria-label={`${place.name} — ${eyebrow}. ${place.modern}`}
                      onPointerEnter={show}
                      onPointerLeave={() => setTip(null)}
                      onFocus={show}
                      onBlur={() => setTip(null)}
                    >
                      <circle r={11} fill="transparent" />
                      <PlaceSymbol kind={place.kind} />
                    </g>
                  );
                })}
              </g>

              <g aria-hidden pointerEvents="none">
                {map.labels.map((label) => (
                  <text key={label.key} x={label.x} y={label.y} textAnchor={label.anchor} className={`map-label ${label.className}`}>
                    {label.text}
                  </text>
                ))}
              </g>

              <g>
                {map.hotspots.map((hotspot) => {
                  const active = hotspot.i === openIndex;
                  return (
                    <g
                      key={`${mapId}-hotspot-${hotspot.i}`}
                      ref={(el) => {
                        hotspotRefs.current[hotspot.i] = el;
                      }}
                      transform={`translate(${hotspot.x} ${hotspot.y})`}
                      className="hotspot"
                      data-active={active}
                      tabIndex={0}
                      role="button"
                      aria-label={`${hotspot.i + 1}. ${STORY.hotspotKinds[hotspot.kind]}: ${hotspot.title}`}
                      aria-expanded={active}
                      aria-controls={active ? "hotspot-card" : undefined}
                      onClick={() => (active ? closeHotspot() : showHotspot(hotspot.i))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (active) closeHotspot();
                          else showHotspot(hotspot.i);
                        }
                      }}
                    >
                      {!active && (
                        <circle r={9} fill="none" stroke="#E8B04B" strokeWidth={1.4} className="animate-pin-pulse origin-center [transform-box:fill-box]" />
                      )}
                      <circle r={9.5} className="hotspot-disc" />
                      <text y={3.8} textAnchor="middle" className="hotspot-number">
                        {hotspot.i + 1}
                      </text>
                    </g>
                  );
                })}
              </g>

              {map.scaleWidth > 0 && (
                <g aria-hidden transform={`translate(${map.width - map.scaleWidth - 20} ${map.height - 22})`}>
                  <rect width={map.scaleWidth / 2} height={4} fill="#A9B4C9" />
                  <rect x={map.scaleWidth / 2} width={map.scaleWidth / 2} height={4} fill="none" stroke="#A9B4C9" strokeWidth={0.8} />
                  <text x={0} y={-5} className="map-label fill-faint font-mono text-[10px]">0</text>
                  <text x={map.scaleWidth} y={-5} textAnchor="end" className="map-label fill-faint font-mono text-[10px]">
                    {map.scaleKm} км
                  </text>
                </g>
              )}
            </svg>
          ) : (
            <p className="absolute inset-0 grid place-items-center text-sm text-muted">
              {failed ? FULL_MAP.failed : FULL_MAP.loading}
            </p>
          )}

          {/* Map header: era, snapshot year and the frame's coordinates */}
          <div className="pointer-events-none absolute top-3 left-3 max-w-[calc(100%-1.5rem)] rounded-xl border border-white/10 bg-navy-950/80 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur-md sm:top-5 sm:left-5 sm:max-w-sm">
            <p className="font-mono text-[11px] tracking-wide text-gold">
              {era.period}
              <span className="text-faint"> · {FULL_MAP.snapshotLabel}: {config.snapshot}</span>
            </p>
            <h1 id="map-title" className="mt-0.5 font-serif text-xl leading-tight font-semibold text-ink sm:text-2xl">
              {era.name}
            </h1>
            <p className="mt-0.5 font-serif text-sm text-gold-soft italic">{story.hook.title}</p>
            <p className="mt-1.5 hidden font-mono text-[10.5px] leading-relaxed text-faint sm:block">
              {FULL_MAP.centreLabel}: {centre}
              <br />
              {FULL_MAP.boundsLabel}: {bounds}
            </p>
          </div>

          {/* Legend; route kinds double as layer toggles */}
          {map && (
            <details
              open={showLegend}
              onToggle={(e) => setLegendOpen(e.currentTarget.open)}
              className="group absolute bottom-3 left-3 max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-white/10 bg-navy-950/85 text-xs text-muted shadow-lg shadow-black/30 backdrop-blur-md sm:bottom-5 sm:left-5 sm:w-64"
            >
              <summary className="cursor-pointer list-none px-3.5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-faint uppercase select-none marker:hidden focus-visible:outline-2 focus-visible:outline-sky-accent">
                {FULL_MAP.legendTitle}
                <span aria-hidden className="float-right transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="space-y-3 px-3.5 pb-3.5">
                <ul className="space-y-1.5">
                  {(["realm", "ally", "ruler", "other"] as const)
                    .filter((role) => map.roles.has(role))
                    .map((role) => (
                      <li key={role} className="flex items-center gap-2.5">
                        <svg aria-hidden width="22" height="12" className="shrink-0">
                          <rect x="1" y="1" width="20" height="10" rx="2" className="polity" data-role={role} />
                        </svg>
                        {FULL_MAP.roles[role]}
                      </li>
                    ))}
                </ul>
                {placeKinds.length > 0 && (
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-white/10 pt-3">
                    {placeKinds.map((kind) => (
                      <li key={kind} className="flex items-center gap-2">
                        <svg aria-hidden width="16" height="16" viewBox="-8 -8 16 16" className="shrink-0">
                          <PlaceSymbol kind={kind} />
                        </svg>
                        {FULL_MAP.places[kind]}
                      </li>
                    ))}
                  </ul>
                )}
                {routeKinds.length > 0 && (
                  <div className="border-t border-white/10 pt-3">
                    <ul className="space-y-0.5">
                      {routeKinds.map((kind) => (
                        <li key={kind}>
                          <button
                            type="button"
                            aria-pressed={!hiddenRoutes.has(kind)}
                            onClick={() => toggleRoute(kind)}
                            className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2.5 rounded-md px-1.5 py-1 text-left transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent aria-[pressed=false]:opacity-40"
                          >
                            <RouteSwatch kind={kind} />
                            {FULL_MAP.routes[kind]}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-[10.5px] text-faint">{FULL_MAP.legendHint}</p>
                  </div>
                )}
              </div>
            </details>
          )}

          <p className="pointer-events-auto absolute right-3 bottom-9 hidden text-right text-[10px] text-faint/80 sm:block">
            <a href={HISTORY_SOURCE.url} target="_blank" rel="noreferrer" className="hover:text-ink">
              {HISTORY_SOURCE.name}
            </a>{" "}
            · {HISTORY_SOURCE.license} ·{" "}
            <a href={HYDRO_SOURCE.url} target="_blank" rel="noreferrer" className="hover:text-ink">
              {HYDRO_SOURCE.name}
            </a>
          </p>

          {tip && (
            <div
              role="tooltip"
              className={`pointer-events-none absolute z-20 max-w-64 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-navy-950 shadow-lg shadow-black/40 ${
                tip.y < 110 ? "translate-y-5" : "-translate-y-[calc(100%+12px)]"
              }`}
              style={{
                left: Math.min(Math.max(tip.x, 136), (map?.width ?? 0) - 136),
                top: tip.y,
              }}
            >
              <p className="text-[10.5px] font-semibold tracking-wide text-[#8a5a12] uppercase">{tip.eyebrow}</p>
              <p className="text-sm leading-snug font-semibold">{tip.title}</p>
              {tip.body && <p className="mt-0.5 text-xs leading-snug text-navy-700">{tip.body}</p>}
            </div>
          )}

          {map && openCard && (
            <div
              id="hotspot-card"
              ref={cardRef}
              tabIndex={-1}
              role="dialog"
              aria-labelledby="hotspot-card-title"
              className="absolute inset-x-3 bottom-3 z-30 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border border-gold/40 bg-navy-900/95 p-4 shadow-2xl shadow-black/50 outline-none backdrop-blur-md sm:inset-x-auto sm:bottom-auto sm:w-80"
              style={
                map.width >= 640
                  ? {
                      left: Math.min(Math.max(openCard.x - 160, 12), map.width - 332),
                      // Open on whichever side of the badge has more room;
                      // the stage clips overflow, so cap the height to fit.
                      ...(map.height - openCard.y >= openCard.y
                        ? { top: openCard.y + 18, maxHeight: map.height - openCard.y - 30 }
                        : { bottom: map.height - openCard.y + 18, maxHeight: openCard.y - 30 }),
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-sky-soft uppercase">
                  <span className="grid size-5 place-items-center rounded-full bg-gold font-mono text-[10px] text-navy-950">
                    {openCard.i + 1}
                  </span>
                  {STORY.hotspotKinds[openCard.kind]}
                </p>
                <button
                  type="button"
                  onClick={closeHotspot}
                  aria-label={STORY.close}
                  className="-mt-1 -mr-1 rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <h2 id="hotspot-card-title" className="mt-2 font-serif text-lg leading-snug font-semibold text-ink">
                {openCard.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{openCard.text}</p>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                <button
                  type="button"
                  onClick={() => showHotspot((openCard.i - 1 + hotspotCount) % hotspotCount)}
                  aria-label={STORY.previous}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <span className="font-mono text-[11px] text-faint">
                  {openCard.i + 1} {STORY.of} {hotspotCount}
                </span>
                <button
                  type="button"
                  onClick={() => showHotspot((openCard.i + 1) % hotspotCount)}
                  aria-label={STORY.next}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </div>

        <div ref={timelineRef} className="border-y border-white/10 bg-navy-950/90">
          <div className="mx-auto max-w-7xl">
            <EraTimeline eras={ERAS} index={eraIndex} onChange={setEraIndex} />
          </div>
        </div>
      </section>

      <EraStory era={era} story={story} onShowHotspot={showHotspotFromStory} />
      <EraDetails era={era} detail={detail} map={config} centre={centre} bounds={bounds} />
    </>
  );
}
