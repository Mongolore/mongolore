"use client";

import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { useEffect, useMemo, useState } from "react";
import { loadJson } from "@/lib/era";
import type { Pin } from "@/lib/lessons";

const LAND_URL = "/data/world-land.geojson";
const OUTLINE_URL = "/data/mongolia-outline.geojson";
const WIDTH = 640;
const HEIGHT = 360;
const PAD = 44;
/** Corners of today's Mongolia: always in frame, as the learner's anchor. */
const MONGOLIA_BOX: [number, number][] = [[87.7, 41.6], [119.9, 52.1]];
export const PIN_LETTERS = ["A", "B", "C", "D"];

type MiniMapProps = {
  pins: Pin[];
  /** Lettered pins to choose from, instead of named ones. */
  pick?: {
    selected: number | null;
    onPick: (index: number) => void;
    /** Once checked, names appear and right/wrong is coloured. */
    checked: boolean;
    answer: number;
  };
};

/** A small map of Mongolia and its surroundings with a handful of places pinned on it. */
export function MiniMap({ pins, pick }: MiniMapProps) {
  const [land, setLand] = useState<GeoPermissibleObjects | null>(null);
  const [outline, setOutline] = useState<GeoPermissibleObjects | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([loadJson<GeoPermissibleObjects>(LAND_URL), loadJson<GeoPermissibleObjects>(OUTLINE_URL)])
      .then(([l, o]) => {
        if (!live) return;
        setLand(l);
        setOutline(o);
      })
      .catch((err: unknown) => console.error("Газрын зургийн өгөгдөл ачаалж чадсангүй", err));
    return () => {
      live = false;
    };
  }, []);

  const map = useMemo(() => {
    const frame = { type: "MultiPoint", coordinates: [...pins.map((p) => p.at), ...MONGOLIA_BOX] } as GeoPermissibleObjects;
    const projection = geoMercator()
      .fitExtent([[PAD, PAD], [WIDTH - PAD, HEIGHT - PAD]], frame)
      .clipExtent([[-10, -10], [WIDTH + 10, HEIGHT + 10]]);
    const path = geoPath(projection);
    return {
      land: land ? (path(land) ?? "") : "",
      outline: outline ? (path(outline) ?? "") : "",
      points: pins.map((p) => projection(p.at) ?? [0, 0]),
    };
  }, [land, outline, pins]);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="block h-auto w-full rounded-2xl border border-white/10 bg-[#0c1630]"
      role={pick ? "group" : "img"}
      aria-label="Газрын зураг"
    >
      <defs>
        <radialGradient id="mini-sea" cx="55%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#1d3763" />
          <stop offset="100%" stopColor="#0a1330" />
        </radialGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#mini-sea)" />
      <path d={map.land} fill="#1c2c55" stroke="rgb(140 198 239 / 0.22)" strokeWidth={0.7} />
      <path d={map.outline} fill="rgb(232 176 75 / 0.14)" stroke="#e8b04b" strokeOpacity={0.75} strokeWidth={1.3} strokeLinejoin="round" />

      {pins.map((pin, i) => {
        const [x, y] = map.points[i];
        if (!pick) {
          const up = i % 2 === 0;
          return (
            <g key={pin.name} transform={`translate(${x} ${y})`}>
              <circle r={9} fill="rgb(232 176 75 / 0.22)" />
              <circle r={4} fill="#fff4da" stroke="#16213e" strokeWidth={1.4} />
              <text y={up ? -12 : 22} textAnchor={x > WIDTH - 90 ? "end" : x < 90 ? "start" : "middle"} className="map-label fill-gold-soft text-[14px] font-semibold">
                {pin.name}
              </text>
            </g>
          );
        }
        const selected = pick.selected === i;
        const right = pick.checked && i === pick.answer;
        const wrong = pick.checked && selected && !right;
        const fill = right ? "#34d399" : wrong ? "#fb7185" : selected ? "#4fa3e0" : "#e8b04b";
        return (
          <g
            key={pin.name}
            transform={`translate(${x} ${y})`}
            role="button"
            tabIndex={pick.checked ? -1 : 0}
            aria-label={`${PIN_LETTERS[i]} цэг`}
            aria-pressed={selected}
            className={pick.checked ? "outline-none" : "cursor-pointer outline-none [&:focus-visible>circle:last-of-type]:stroke-sky-accent"}
            onClick={() => !pick.checked && pick.onPick(i)}
            onKeyDown={(e) => {
              if (pick.checked || (e.key !== "Enter" && e.key !== " ")) return;
              e.preventDefault();
              e.stopPropagation();
              pick.onPick(i);
            }}
          >
            {/* Generous touch target */}
            <circle r={30} fill="transparent" />
            {(selected || right) && <circle r={25} fill={fill} fillOpacity={0.25} className={selected && !pick.checked ? "animate-pulse" : ""} />}
            <circle r={17} fill={fill} stroke="#0f172e" strokeWidth={2.5} />
            <text y={6} textAnchor="middle" className="pointer-events-none fill-navy-950 text-[17px] font-extrabold">
              {PIN_LETTERS[i]}
            </text>
            {pick.checked && (
              <text y={-24} textAnchor={x > WIDTH - 90 ? "end" : x < 90 ? "start" : "middle"} className={`map-label text-[14px] font-semibold ${right ? "fill-emerald-200" : "fill-ink"}`}>
                {pin.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
