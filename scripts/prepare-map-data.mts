/**
 * Prepares the map GeoJSON in `public/data/` for d3-geo and checks names.
 *
 *   npx mapshaper <geoBoundaries-MNG-ADM1_simplified.geojson> \
 *     -simplify 18% weighted keep-shapes -clean -filter-fields shapeISO,shapeName \
 *     -o public/data/mongolia-aimags.geojson precision=0.0001 format=geojson
 *   npm run map:prepare
 *
 * geoBoundaries uses RFC 7946 (counter-clockwise) winding; d3-geo expects
 * clockwise exterior rings, so rings are rewound in place.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { geoArea } from "d3-geo";
import { REGIONS } from "../data/aimags.ts";

const FILE = new URL("../public/data/mongolia-aimags.geojson", import.meta.url);
const NEIGHBOURS_FILE = new URL("../public/data/neighbours.geojson", import.meta.url);
const OUTLINE_FILE = new URL("../public/data/mongolia-outline.geojson", import.meta.url);
const EXPECTED = 22;

type Ring = number[][];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };
type Feature = {
  type: "Feature";
  properties: Record<string, string>;
  geometry: Geometry;
};

/** geoBoundaries/Natural Earth use RFC 7946 winding; d3-geo wants the reverse. */
function rewindGeometry(geometry: Geometry) {
  if (geoArea(geometry as never) <= 2 * Math.PI) return;
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) for (const ring of polygon) ring.reverse();
}

function rewind(feature: Feature) {
  rewindGeometry(feature.geometry);
}

const data = JSON.parse(readFileSync(FILE, "utf8")) as { features: Feature[] };

let failed = false;
if (data.features.length !== EXPECTED) {
  console.error(`Expected ${EXPECTED} features, found ${data.features.length}`);
  failed = true;
}

for (const feature of data.features) {
  const { shapeISO, shapeName } = feature.properties;
  const region = REGIONS[shapeISO];
  if (!region) {
    console.error(`No Mongolian name for ${shapeISO} (${shapeName})`);
    failed = true;
  } else {
    console.log(`${shapeISO.padEnd(7)} ${shapeName.padEnd(14)} → ${region.name}`);
  }

  rewind(feature);
}

const missing = Object.keys(REGIONS).filter(
  (iso) => !data.features.some((f) => f.properties.shapeISO === iso),
);
if (missing.length) {
  console.error(`Regions missing from GeoJSON: ${missing.join(", ")}`);
  failed = true;
}

const neighbours = JSON.parse(readFileSync(NEIGHBOURS_FILE, "utf8")) as {
  features: Feature[];
};
for (const feature of neighbours.features) rewind(feature);
console.log(
  `neighbours: ${neighbours.features.map((f) => f.properties.ADM0_A3).join(", ")}`,
);

// Dissolved national outline, written by mapshaper as a GeometryCollection.
const outline = JSON.parse(readFileSync(OUTLINE_FILE, "utf8")) as {
  type: string;
  geometries: Geometry[];
};
for (const geometry of outline.geometries) rewindGeometry(geometry);

if (failed) process.exit(1);
writeFileSync(FILE, JSON.stringify(data));
writeFileSync(NEIGHBOURS_FILE, JSON.stringify(neighbours));
writeFileSync(OUTLINE_FILE, JSON.stringify(outline));
console.log(`OK: ${data.features.length} regions, all named, winding fixed.`);
