"use client";

import {
  geoArea,
  geoBounds,
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Pause, Play, Rotate3d } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ERAS } from "@/data/eras";
import { ERA_MAPS, type LonLat } from "@/data/historyMaps";
import { FULL_MAP, GLOBE } from "@/data/site";
import { eraGeoUrl, loadJson, useEraIndex, type PolityCollection, type PolityFeature } from "@/lib/era";
import { EraTimeline } from "./EraTimeline";

const LAND_URL = "/data/world-land.geojson";
const OUTLINE_URL = "/data/mongolia-outline.geojson";
const EARTH_RADIUS_KM = 6371;
const MONGOLIA_AT: LonLat = [103.5, 46.6];
const AUTOPLAY_MS = 3400;
const DEG = 180 / Math.PI;

type Group = { type: "FeatureCollection"; features: PolityFeature[] };
type EraLayer = {
  land: Group;
  other: Group;
  ruler: Group;
  ally: Group;
  realm: Group;
  /** Today's outline stands in for the realm once the borders match today's. */
  modern: boolean;
  /** Just inside the data's edge: drawing is clipped to it so the cut-off never shows. */
  frame: GeoPermissibleObjects;
  labels: { text: string; at: LonLat; role: "realm" | "ruler" | "other" }[];
};
type Camera = { lon: number; lat: number; k: number };

const group = (features: PolityFeature[]): Group => ({ type: "FeatureCollection", features });
const geo = (g: unknown) => g as GeoPermissibleObjects;

function buildLayer(id: string, data: PolityCollection): EraLayer {
  const by = (role: string) => group(data.features.filter((f) => f.properties.role === role));
  const config = ERA_MAPS[id];
  const labels: EraLayer["labels"] = [];
  for (const f of data.features) {
    const { role, label, labelAt } = f.properties;
    if (!label || !labelAt || (role !== "realm" && role !== "ruler" && role !== "other")) continue;
    labels.push({ text: label, at: labelAt, role });
  }
  if (config?.modernRealm) {
    labels.push({ text: config.modernRealm.label, at: config.modernRealm.labelAt ?? MONGOLIA_AT, role: "realm" });
  }
  const [[west, south], [east, north]] = geoBounds(geo(data));
  const inset = 0.6;
  const [w, s, e, n] = [west + inset, south + inset, east - inset, north - inset];
  const ring: LonLat[] = [];
  for (let lat = s; lat < n; lat += 2) ring.push([w, lat]);
  for (let lon = w; lon < e; lon += 2) ring.push([lon, n]);
  for (let lat = n; lat > s; lat -= 2) ring.push([e, lat]);
  for (let lon = e; lon > w; lon -= 2) ring.push([lon, s]);
  ring.push([w, s]);
  return {
    frame: geo({ type: "Polygon", coordinates: [ring] }),
    land: by("land"),
    other: by("other"),
    ruler: by("ruler"),
    ally: by("ally"),
    realm: by("realm"),
    modern: !!config?.modernRealm,
    labels,
  };
}

/** Where the globe turns to for an era: centred on its view, closer for smaller realms. */
function cameraFor(id: string): Camera {
  const v = ERA_MAPS[id]?.view ?? { west: 80, south: 35, east: 128, north: 56 };
  const lat = (v.south + v.north) / 2;
  const half = Math.max(((v.east - v.west) / 2) * Math.cos(lat / DEG), (v.north - v.south) / 2);
  return {
    lon: (v.west + v.east) / 2,
    lat,
    k: Math.min(0.6, Math.max(0.46, 0.46 + (50 - half) * 0.005)),
  };
}

function useTween(target: number, ms = 900) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const v = a + (target - a) * (1 - (1 - t) ** 3);
      from.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/** A 3D globe whose borders follow the timeline: drag the era, watch the realm change shape. */
export function TimeGlobe() {
  const [index, setIndex] = useEraIndex();
  const [playing, setPlaying] = useState(false);
  const [areas, setAreas] = useState<Record<string, number>>({});
  const [todayArea, setTodayArea] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const era = ERAS[index];

  // Everything the render loop reads lives in refs, so drawing never waits on React.
  const eraId = useRef(era.id);
  const layers = useRef(new Map<string, EraLayer>());
  const land = useRef<GeoPermissibleObjects | null>(null);
  const outline = useRef<GeoPermissibleObjects | null>(null);
  const drag = useRef<{ x: number; y: number; touch: boolean } | null>(null);
  const holdUntil = useRef(0);
  const camera = useRef<Camera>(cameraFor(era.id));

  useEffect(() => {
    eraId.current = era.id;
    holdUntil.current = 0;
  }, [era.id]);

  useEffect(() => {
    let live = true;
    const fail = (err: unknown) => console.error("Бөмбөрцгийн өгөгдөл ачаалж чадсангүй", err);
    loadJson<GeoPermissibleObjects>(LAND_URL).then((d) => { land.current = d; }).catch(fail);
    loadJson<GeoPermissibleObjects>(OUTLINE_URL)
      .then((d) => {
        outline.current = d;
        if (live) setTodayArea(geoArea(d) * EARTH_RADIUS_KM ** 2);
      })
      .catch(fail);

    const loadEra = (id: string) =>
      loadJson<PolityCollection>(eraGeoUrl(id))
        .then((data) => {
          const layer = layers.current.get(id) ?? buildLayer(id, data);
          layers.current.set(id, layer);
          if (live && !layer.modern) {
            setAreas((all) => ({ ...all, [id]: geoArea(geo(layer.realm)) * EARTH_RADIUS_KM ** 2 }));
          }
        })
        .catch(fail);

    // The opening era first, then the rest quietly so dragging never stalls.
    const first = eraId.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    loadEra(first).then(() => {
      const rest = ERAS.map((e) => e.id).filter((id) => id !== first);
      const next = () => {
        const id = rest.shift();
        if (!id || !live) return;
        loadEra(id).then(() => { timer = setTimeout(next, 120); });
      };
      timer = setTimeout(next, 600);
    });
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  const eraIndexRef = useRef(index);
  useEffect(() => {
    eraIndexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setIndex((eraIndexRef.current + 1) % ERAS.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [playing, setIndex]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);

    const style = getComputedStyle(document.documentElement);
    const sans = getComputedStyle(canvas).fontFamily || "sans-serif";
    const serif = `${style.getPropertyValue("--font-literata") || "Georgia"}, serif`;

    const projection = geoOrthographic().clipAngle(90).precision(0.5);
    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();
    const alpha = new Map<string, number>();
    let last = performance.now();
    let raf = 0;

    const text = (label: string, x: number, y: number, fill: string, font: string, align: CanvasTextAlign = "center", halo = "rgba(9, 15, 34, 0.85)") => {
      ctx.font = font;
      ctx.textAlign = align;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = "round";
      ctx.strokeStyle = halo;
      ctx.strokeText(label, x, y);
      ctx.fillStyle = fill;
      ctx.fillText(label, x, y);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || width === 0) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Camera: ease towards the era's view unless the visitor is holding the globe.
      const cam = camera.current;
      const goal = cameraFor(eraId.current);
      if (!drag.current && now > holdUntil.current) {
        const ease = reduceMotion ? 1 : 1 - Math.exp(-dt * 3);
        cam.lon += ((((goal.lon - cam.lon) % 360) + 540) % 360 - 180) * ease;
        cam.lat += (goal.lat - cam.lat) * ease;
      }
      cam.k += (goal.k - cam.k) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 3));
      const sway = reduceMotion || drag.current ? 0 : Math.sin(now / 4200) * 2.4;

      const cx = width / 2;
      const cy = height / 2;
      const R = cam.k * Math.min(width, height);
      const centre: LonLat = [cam.lon + sway, cam.lat];
      projection.translate([cx, cy]).scale(R).rotate([-centre[0], -centre[1]]);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Atmosphere
      const halo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.22);
      halo.addColorStop(0, "rgba(96, 178, 240, 0.42)");
      halo.addColorStop(0.35, "rgba(79, 163, 224, 0.14)");
      halo.addColorStop(1, "rgba(79, 163, 224, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // Ocean
      const sea = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.1, cx, cy, R);
      sea.addColorStop(0, "#1d3763");
      sea.addColorStop(1, "#0a1330");
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = sea;
      ctx.fill();

      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = "rgba(140, 198, 239, 0.07)";
      ctx.lineWidth = 0.6;
      ctx.stroke();

      if (land.current) {
        ctx.beginPath();
        path(land.current);
        ctx.fillStyle = "#1b2b55";
        ctx.fill();
      }

      // Era layers cross-fade, so borders melt from one era into the next.
      const current = eraId.current;
      if (!alpha.has(current)) alpha.set(current, 0);
      const fade = reduceMotion ? 1 : 1 - Math.exp(-dt * 5.5);
      for (const [id, a] of alpha) {
        const target = id === current && layers.current.has(id) ? 1 : 0;
        const next = a + (target - a) * fade;
        if (id !== current && next < 0.01) alpha.delete(id);
        else alpha.set(id, next);
      }

      const fill = (g: unknown, fillStyle: string | CanvasGradient, stroke?: string, lineWidth = 0.6, dash?: number[]) => {
        ctx.beginPath();
        path(geo(g));
        ctx.fillStyle = fillStyle;
        ctx.fill();
        if (stroke) {
          ctx.setLineDash(dash ?? []);
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      };

      for (const [id, a] of alpha) {
        const layer = layers.current.get(id);
        if (!layer || a <= 0.01) continue;
        ctx.save();
        ctx.beginPath();
        path(layer.frame);
        ctx.clip();
        ctx.globalAlpha = a;
        fill(layer.land, "#1b2b55", "rgba(140, 198, 239, 0.12)", 0.5);
        fill(layer.other, "#1b2b55", "rgba(140, 198, 239, 0.34)", 0.7);
        fill(layer.ruler, "#3d3060", "rgba(196, 160, 232, 0.7)", 0.9);
        fill(layer.ally, "rgba(232, 176, 75, 0.2)", "rgba(232, 176, 75, 0.7)", 0.8, [3, 2.5]);

        const realm = layer.modern ? outline.current : layer.realm;
        if (realm) {
          // A darker copy underneath gives the realm a raised, slab-like edge.
          const lift = Math.max(2, R * 0.012);
          ctx.save();
          ctx.translate(0, lift);
          fill(realm, "#7a5519");
          ctx.restore();
          ctx.save();
          ctx.shadowColor = "rgba(232, 176, 75, 0.55)";
          ctx.shadowBlur = 26 * dpr;
          const gold = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
          gold.addColorStop(0, "#f6d48a");
          gold.addColorStop(1, "#d99a35");
          fill(realm, gold);
          ctx.restore();
          ctx.beginPath();
          path(geo(realm));
          ctx.strokeStyle = "#fff0c9";
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Today's Mongolia, dashed, for scale against every older realm.
      const currentLayer = layers.current.get(current);
      if (outline.current && currentLayer && !currentLayer.modern) {
        ctx.beginPath();
        path(outline.current);
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "rgba(10, 19, 48, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Limb shading: the sphere falls into shadow towards its edge.
      ctx.save();
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.clip();
      const shade = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.38, R * 0.35, cx, cy, R * 1.02);
      shade.addColorStop(0, "rgba(255, 255, 255, 0.05)");
      shade.addColorStop(0.55, "rgba(6, 11, 28, 0)");
      shade.addColorStop(1, "rgba(4, 8, 22, 0.78)");
      ctx.fillStyle = shade;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      const onFront = (at: LonLat) => geoDistance(centre, at) < 1.25;
      const wide = width >= 560;

      if (currentLayer) {
        ctx.globalAlpha = alpha.get(current) ?? 1;
        for (const label of currentLayer.labels) {
          if (label.role === "other" && !wide) continue;
          if (!onFront(label.at)) continue;
          const p = projection(label.at);
          if (!p) continue;
          if (label.role === "realm") text(label.text, p[0], p[1], "#2a1c05", `700 ${wide ? 13 : 11}px ${serif}`, "center", "rgba(255, 240, 201, 0.75)");
          else if (label.role === "ruler") text(label.text, p[0], p[1], "#dccbf3", `600 12px ${serif}`);
          else text(label.text, p[0], p[1], "rgba(169, 180, 201, 0.85)", `500 10.5px ${serif}`);
        }
        ctx.globalAlpha = 1;
      }

      // Era sites: pulsing gold pins.
      const sites = ERAS.find((e) => e.id === current)?.sites ?? [];
      sites.forEach((site, i) => {
        if (!onFront(site.coordinates)) return;
        const p = projection(site.coordinates);
        if (!p) return;
        if (!reduceMotion) {
          const pulse = (now / 2600 + i * 0.37) % 1;
          ctx.beginPath();
          ctx.arc(p[0], p[1], 4 + pulse * 13, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 244, 218, ${0.85 * (1 - pulse)})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3.6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff4da";
        ctx.fill();
        ctx.strokeStyle = "#16213e";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        if (wide) {
          const left = p[0] > cx + R * 0.45;
          text(site.name, p[0] + (left ? -9 : 9), p[1] - 8, "#fff4da", `600 11px ${sans}`, left ? "right" : "left");
        }
      });
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      io.disconnect();
    };
  }, [reduceMotion]);

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, touch: e.pointerType === "touch" };
  };
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const perPx = DEG / (camera.current.k * Math.min(rect.width, rect.height));
    camera.current.lon -= (e.clientX - d.x) * perPx;
    // Touch keeps vertical swipes for scrolling the page.
    if (!d.touch) {
      camera.current.lat = Math.min(80, Math.max(-20, camera.current.lat + (e.clientY - d.y) * perPx));
    }
    d.x = e.clientX;
    d.y = e.clientY;
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    holdUntil.current = performance.now() + 4000;
  };

  const choose = (next: number) => {
    setPlaying(false);
    setIndex(next);
  };

  const config = ERA_MAPS[era.id];
  const area = config?.modernRealm ? todayArea : (areas[era.id] ?? 0);
  const shownArea = useTween(area / 1e6);
  const ratio = todayArea > 0 ? area / todayArea : 0;
  const shownRatio = useTween(ratio);

  return (
    <div className="relative">
      <div className="relative aspect-square sm:aspect-[5/4] lg:aspect-auto lg:h-[min(70vh,660px)]">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${GLOBE.aria}: ${era.name}, ${era.period}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="globe-canvas absolute inset-0 size-full cursor-grab touch-pan-y active:cursor-grabbing"
        />

        <div aria-live="polite" className="pointer-events-none absolute top-2 left-0 max-w-[60%] sm:top-4">
          <p key={`p-${era.id}`} className="era-fade font-mono text-xs tracking-[0.2em] text-gold uppercase">
            {era.period}
          </p>
          <p
            key={era.id}
            className="era-rise mt-1 font-serif text-2xl leading-tight font-semibold text-ink drop-shadow-[0_2px_12px_rgb(9_15_34/0.9)] sm:text-4xl"
          >
            {era.name}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-faint">
            {FULL_MAP.snapshotLabel}: {config?.snapshot}
          </p>
        </div>

        <p className="pointer-events-none absolute top-3 right-0 hidden items-center gap-1.5 rounded-full border border-white/10 bg-navy-950/60 px-3 py-1.5 text-[11px] text-muted backdrop-blur sm:flex">
          <Rotate3d className="size-3.5 text-sky-soft" aria-hidden />
          {GLOBE.dragHint}
        </p>

        {area > 0 && (
          <div className="pointer-events-none absolute bottom-2 left-0 sm:bottom-4">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-faint uppercase">{GLOBE.areaLabel}</p>
            <p className="font-serif text-3xl leading-none font-bold text-gold-soft tabular-nums drop-shadow-[0_2px_12px_rgb(9_15_34/0.9)] sm:text-5xl">
              {shownArea.toFixed(1)}
              <span className="ml-1.5 font-sans text-sm font-semibold text-gold sm:text-base">{GLOBE.areaUnit}</span>
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {GLOBE.ratioPrefix}{" "}
              <span className="font-semibold text-ink tabular-nums">×{shownRatio.toFixed(1)}</span>
            </p>
          </div>
        )}

        <ul className="pointer-events-none absolute right-0 bottom-3 hidden flex-col gap-1.5 text-[11px] text-muted sm:flex">
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-4 rounded-[3px] bg-gradient-to-b from-gold-soft to-gold" />
            {FULL_MAP.roles.realm}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-4 rounded-[3px] border border-dashed border-gold/80 bg-gold/20" />
            {FULL_MAP.roles.ally}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-0 w-4 border-t-2 border-dashed border-navy-950 bg-gold" />
            {GLOBE.todayLegend}
          </li>
        </ul>
      </div>

      <div className="glass relative mt-3 rounded-2xl">
        <EraTimeline eras={ERAS} index={index} onChange={choose} />
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={playing}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 py-1.5 pr-4 pl-1.5 text-sm font-semibold text-gold-soft transition hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span className="grid size-7 place-items-center rounded-full bg-gold text-navy-950">
              {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5 translate-x-px" aria-hidden />}
            </span>
            {playing ? GLOBE.pause : GLOBE.play}
          </button>
          <Link
            href={`/map?era=${era.id}`}
            className="group inline-flex items-center gap-1.5 rounded text-sm font-medium text-sky-soft transition-colors hover:text-gold-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-accent"
          >
            {FULL_MAP.openFull}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
