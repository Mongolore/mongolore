/**
 * Checks the content data files for broken references before a deploy.
 *
 *   npm run check:data
 *
 * Catches the mistakes that are easy to make when editing content by hand:
 * unknown aimag codes, coordinates outside the map, duplicate ids and missing
 * team photos.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { REGIONS } from "../data/aimags.ts";
import { AIMAG_EVENTS } from "../data/aimagInfo.ts";
import { ERAS } from "../data/eras.ts";
import { FEATURES } from "../data/features.ts";
import { NEIGHBOURS } from "../data/neighbours.ts";
import { TEAM } from "../data/team.ts";

/** Covers Mongolia plus the neighbouring countries drawn on the map. */
const BOUNDS = { minLon: 70, maxLon: 135, minLat: 30, maxLat: 60 };

const problems: string[] = [];
const check = (ok: boolean, message: string) => {
  if (!ok) problems.push(message);
};

const eraIds = new Set<string>();
for (const era of ERAS) {
  check(!eraIds.has(era.id), `eras: duplicate id "${era.id}"`);
  eraIds.add(era.id);
  check(era.summary.trim().length > 0, `eras: "${era.id}" has an empty summary`);

  for (const iso of era.regions) {
    check(iso in REGIONS, `eras: "${era.id}" references unknown region "${iso}"`);
  }

  for (const site of era.sites) {
    const [lon, lat] = site.coordinates;
    check(
      lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon,
      `eras: "${site.name}" longitude ${lon} is outside the map`,
    );
    check(
      lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat,
      `eras: "${site.name}" latitude ${lat} is outside the map`,
    );
    check(
      !site.country || site.country in NEIGHBOURS,
      `eras: "${site.name}" references unknown country "${site.country}"`,
    );
  }
}

const featureIds = new Set<string>();
for (const feature of FEATURES) {
  check(!featureIds.has(feature.id), `features: duplicate id "${feature.id}"`);
  featureIds.add(feature.id);
}

for (const iso of Object.keys(AIMAG_EVENTS)) {
  check(iso in REGIONS, `aimagInfo: unknown region "${iso}"`);
}

for (const member of TEAM) {
  if (!member.photo) continue;
  const path = fileURLToPath(new URL(`../public${member.photo}`, import.meta.url));
  check(existsSync(path), `team: photo for ${member.name} not found at public${member.photo}`);
}

if (problems.length > 0) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}

console.log(
  `OK: ${ERAS.length} eras, ${FEATURES.length} features, ${TEAM.length} team members, ${Object.keys(REGIONS).length} regions.`,
);
