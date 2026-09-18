/**
 * Prepares `public/data/mongolia-aimags.geojson` for d3-geo and checks names.
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
const EXPECTED = 22;

type Ring = number[][];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };
type Feature = {
  type: "Feature";
  properties: { shapeISO: string; shapeName: string };
  geometry: Geometry;
};

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

  // A polygon larger than a hemisphere means its rings are inside-out for d3.
  if (geoArea(feature as never) > 2 * Math.PI) {
    const polygons =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) ring.reverse();
  }
}

const missing = Object.keys(REGIONS).filter(
  (iso) => !data.features.some((f) => f.properties.shapeISO === iso),
);
if (missing.length) {
  console.error(`Regions missing from GeoJSON: ${missing.join(", ")}`);
  failed = true;
}

if (failed) process.exit(1);
writeFileSync(FILE, JSON.stringify(data));
console.log(`OK: ${data.features.length} regions, all named, winding fixed.`);
