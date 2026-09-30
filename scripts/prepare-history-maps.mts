/**
 * Builds the historical border files for the map from `data/historyMaps.ts`.
 *
 *   npm run map:history
 *
 * For each era it downloads the historical-basemaps snapshot (cached in
 * node_modules/.cache/history-maps), clips it to the era's view, simplifies
 * it for that scale and writes public/data/history/<era id>.geojson with
 * `role`, `label` and `labelAt` properties the map reads directly.
 *
 * It also writes public/data/history/hydro.geojson: rivers and lakes from
 * Natural Earth (10m rivers around Mongolia, 50m elsewhere).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoArea, geoCentroid } from "d3-geo";
import { ERA_MAPS, type Polity, type ViewWindow } from "../data/historyMaps.ts";
import { ERAS } from "../data/eras.ts";

const require = createRequire(import.meta.url);
const mapshaper = require("mapshaper") as {
  applyCommands(commands: string, input: Record<string, unknown>): Promise<Record<string, string>>;
};

const CACHE = new URL("../node_modules/.cache/history-maps/", import.meta.url);
const OUT = new URL("../public/data/history/", import.meta.url);
const BASEMAPS = "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/";
const NATURAL_EARTH = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/";

/** Rivers named on the map, keyed by Natural Earth `name`. */
const RIVER_LABELS: Record<string, string> = {
  Selenga: "Сэлэнгэ",
  Orhon: "Орхон",
  Herlen: "Хэрлэн",
  Onon: "Онон",
  "Argun’": "Эргүнэ",
};

/** The 10m set has the Orkhon, Kherlen and Onon, which the 50m set lacks. */
const DETAIL_BOX: ViewWindow = { west: 84, south: 38, east: 128, north: 56 };
const HYDRO_BOX: ViewWindow = { west: 0, south: 0, east: 170, north: 72 };

type Ring = number[][];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] }
  | { type: "LineString"; coordinates: Ring }
  | { type: "MultiLineString"; coordinates: Ring[] }
  | { type: "Point"; coordinates: number[] };
type Feature = { type: "Feature"; properties: Record<string, unknown>; geometry: Geometry | null };
type Collection = { type: "FeatureCollection"; features: Feature[] };

async function cached(url: string, file: string): Promise<Collection> {
  mkdirSync(CACHE, { recursive: true });
  const path = new URL(file, CACHE);
  if (!existsSync(path)) {
    console.log(`↓ ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    writeFileSync(path, await res.text());
  }
  return JSON.parse(readFileSync(path, "utf8")) as Collection;
}

async function run(commands: string, input: Record<string, unknown>): Promise<Collection> {
  const output = await mapshaper.applyCommands(`${commands} -o out.json format=geojson`, input);
  return JSON.parse(String(output["out.json"])) as Collection;
}

const bboxOf = (v: ViewWindow) => `${v.west},${v.south},${v.east},${v.north}`;

/**
 * The view plus a margin, since the conic projection curves the frame's
 * edges and the full-screen map (/map) shows well past the view on wide or
 * tall screens.
 */
function clipWindow(v: ViewWindow): ViewWindow {
  const dx = Math.max((v.east - v.west) * 0.25, 30);
  const dy = Math.max((v.north - v.south) * 0.25, 14);
  return {
    west: Math.max(-180, v.west - dx),
    south: Math.max(-85, v.south - dy),
    east: Math.min(180, v.east + dx),
    north: Math.min(85, v.north + dy),
  };
}

/** Simplify to roughly half a pixel on the 800px-wide map. */
function simplifyInterval(v: ViewWindow) {
  const midLat = ((v.south + v.north) / 2) * (Math.PI / 180);
  const kmPerPx = ((v.east - v.west) * 111 * Math.cos(midLat)) / 800;
  return Math.max(1000, Math.round(kmPerPx * 500));
}

/** d3-geo wants clockwise exterior rings; mapshaper writes RFC 7946 (counter-clockwise). */
function rewind(feature: Feature) {
  const g = feature.geometry;
  if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return;
  if (geoArea(g as never) <= 2 * Math.PI) return;
  const polygons = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const polygon of polygons) for (const ring of polygon) ring.reverse();
}

/** Label point: centroid of the largest part, so a stray island doesn't pull it off. */
function labelPoint(feature: Feature): [number, number] | undefined {
  const g = feature.geometry;
  if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return undefined;
  const parts = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  let best: Ring[] | undefined;
  let bestArea = -1;
  for (const part of parts) {
    const area = geoArea({ type: "Polygon", coordinates: part } as never);
    if (area > bestArea) [best, bestArea] = [part, area];
  }
  if (!best) return undefined;
  const [lon, lat] = geoCentroid({ type: "Polygon", coordinates: best } as never);
  return [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100];
}

function tag(feature: Feature, polity: Polity | undefined) {
  rewind(feature);
  const name = feature.properties.NAME ?? feature.properties.name;
  feature.properties = {
    name: typeof name === "string" ? name : null,
    role: polity?.role ?? "land",
  };
  if (polity?.label) {
    feature.properties.label = polity.label;
    feature.properties.labelAt = polity.labelAt ?? labelPoint(feature);
  }
}

let failed = false;
mkdirSync(OUT, { recursive: true });

for (const era of ERAS) {
  const config = ERA_MAPS[era.id];
  if (!config) {
    console.error(`✗ ${era.id}: no entry in ERA_MAPS`);
    failed = true;
    continue;
  }

  const world = await cached(`${BASEMAPS}world_${config.source}.geojson`, `world_${config.source}.geojson`);
  const clip = bboxOf(clipWindow(config.view));
  const interval = simplifyInterval(config.view);
  const base = await run(
    `-i src.json -filter-fields NAME -clean -clip bbox=${clip} -simplify interval=${interval} keep-shapes`,
    { "src.json": world },
  );

  const features: Feature[] = [];
  const seen = new Set<string>();

  for (const feature of base.features) {
    const name = String(feature.properties.NAME ?? "");
    if (config.derive && name === config.derive.from) {
      const { mask, inside, outside } = config.derive;
      const maskLayer: Collection = {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [mask] } }],
      };
      const input = { "src.json": { type: "FeatureCollection", features: [feature] }, "mask.json": maskLayer };
      const combine = "-i src.json mask.json combine-files";
      const [inPart, outPart] = await Promise.all([
        run(`${combine} -clip target=src source=mask`, input),
        run(`${combine} -erase target=src source=mask -explode`, input),
      ]);
      for (const f of inPart.features) {
        tag(f, inside);
        features.push(f);
      }
      // Leftover pieces keep the neighbour's colour (islands such as Taiwan
      // stay part of it) and only the largest is labelled; slivers under 0.1% of
      // the largest, which the mask's edge cuts off, are drawn as plain land.
      const pieces = outPart.features.filter((f) => f.geometry);
      // Rewind before measuring: d3 reads a counter-clockwise ring as its
      // complement, which would make the smallest piece look the largest.
      pieces.forEach(rewind);
      const largestArea = Math.max(0, ...pieces.map((f) => geoArea(f as never)));
      for (const f of pieces) {
        const area = geoArea(f as never);
        if (area === largestArea) tag(f, outside);
        else if (area >= largestArea * 0.001) tag(f, { role: outside.role });
        else tag(f, undefined);
      }
      features.push(...pieces);
      seen.add(name);
      continue;
    }
    const polity = config.polities[name];
    if (polity) seen.add(name);
    tag(feature, polity);
    features.push(feature);
  }

  for (const name of Object.keys(config.polities)) {
    if (!seen.has(name)) {
      console.error(`✗ ${era.id}: "${name}" is not in world_${config.source} within the view`);
      failed = true;
    }
  }
  if (config.derive && !seen.has(config.derive.from)) {
    console.error(`✗ ${era.id}: derive source "${config.derive.from}" not found`);
    failed = true;
  }

  const out = JSON.stringify({ type: "FeatureCollection", features: features.filter((f) => f.geometry) });
  writeFileSync(new URL(`${era.id}.geojson`, OUT), out);
  console.log(`${era.id.padEnd(16)} world_${config.source.padEnd(6)} ${(out.length / 1024).toFixed(0).padStart(4)} KB`);
}

// ---- Rivers and lakes ----
const [rivers50, rivers10, lakes50] = await Promise.all([
  cached(`${NATURAL_EARTH}ne_50m_rivers_lake_centerlines.geojson`, "ne_50m_rivers.geojson"),
  cached(`${NATURAL_EARTH}ne_10m_rivers_lake_centerlines.geojson`, "ne_10m_rivers.geojson"),
  cached(`${NATURAL_EARTH}ne_50m_lakes.geojson`, "ne_50m_lakes.geojson"),
]);

const hydroInterval = 3000;
const [wideRivers, detailRivers, lakes] = await Promise.all([
  run(
    `-i src.json -filter 'scalerank <= 5' -clip bbox=${bboxOf(HYDRO_BOX)} -erase bbox=${bboxOf(DETAIL_BOX)} -simplify interval=${hydroInterval} -filter-fields name`,
    { "src.json": rivers50 },
  ),
  run(
    `-i src.json -clip bbox=${bboxOf(DETAIL_BOX)} -filter 'scalerank <= 9' -simplify interval=${hydroInterval} -filter-fields name`,
    { "src.json": rivers10 },
  ),
  run(
    `-i src.json -filter 'scalerank <= 2' -clip bbox=${bboxOf(HYDRO_BOX)} -simplify interval=${hydroInterval} keep-shapes -filter-fields name`,
    { "src.json": lakes50 },
  ),
]);

const hydro: Feature[] = [];

// One label per named river, at the middle vertex of its longest line.
for (const [name, label] of Object.entries(RIVER_LABELS)) {
  const lines = detailRivers.features
    .filter((f) => f.properties.name === name)
    .flatMap((f) => {
      const g = f.geometry;
      if (g?.type === "LineString") return [g.coordinates];
      if (g?.type === "MultiLineString") return g.coordinates;
      return [];
    });
  const longest = lines.sort((a, b) => b.length - a.length)[0];
  if (!longest) {
    console.error(`✗ hydro: river "${name}" not found`);
    failed = true;
    continue;
  }
  const [lon, lat] = longest[Math.floor(longest.length / 2)];
  hydro.push({
    type: "Feature",
    properties: { kind: "river-label", label },
    geometry: { type: "Point", coordinates: [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100] },
  });
}

for (const f of [...wideRivers.features, ...detailRivers.features]) {
  f.properties = { kind: "river" };
  hydro.push(f);
}
for (const f of lakes.features) {
  f.properties = { kind: "lake" };
  rewind(f);
  hydro.push(f);
}

const hydroOut = JSON.stringify({ type: "FeatureCollection", features: hydro.filter((f) => f.geometry) });
writeFileSync(new URL("hydro.geojson", OUT), hydroOut);
console.log(`${"hydro".padEnd(16)} ${"natural earth".padEnd(12)} ${(hydroOut.length / 1024).toFixed(0).padStart(4)} KB`);

if (failed) process.exit(1);
console.log("OK");
