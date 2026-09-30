/**
 * Checks the content data files for broken references before a deploy.
 *
 *   npm run check:data
 *
 * Catches the mistakes that are easy to make when editing content by hand:
 * unknown aimag codes, coordinates outside the map, duplicate ids, eras
 * without a historical map, details or story, story cards over the word
 * limit, and missing team photos.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { REGIONS } from "../data/aimags.ts";
import { AIMAG_EVENTS, MAP_HISTORICAL_DATA } from "../data/aimagInfo.ts";
import { ERA_DETAILS } from "../data/eraDetails.ts";
import { ERAS } from "../data/eras.ts";
import { ERA_STORIES } from "../data/eraStories.ts";
import { FEATURES } from "../data/features.ts";
import { ERA_MAPS } from "../data/historyMaps.ts";
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

/** Region numeric ids used as inner keys of `MAP_HISTORICAL_DATA`. */
const numericIds = new Set(
  Object.values(REGIONS)
    .map((region) => region.numericId)
    .filter((id): id is string => typeof id === "string"),
);

const dataKeys = new Set<string>();
for (const [dataKey, entries] of Object.entries(MAP_HISTORICAL_DATA)) {
  dataKeys.add(dataKey);
  for (const numericId of Object.keys(entries)) {
    check(
      numericIds.has(numericId),
      `MAP_HISTORICAL_DATA["${dataKey}"]: unknown aimag id "${numericId}"`,
    );
    check(
      entries[numericId].trim().length > 0,
      `MAP_HISTORICAL_DATA["${dataKey}"]: empty entry for "${numericId}"`,
    );
  }
}

for (const era of ERAS) {
  check(
    typeof era.dataKey === "string" && era.dataKey.length > 0,
    `eras: "${era.id}" is missing a dataKey`,
  );
  if (typeof era.dataKey === "string" && era.dataKey.length > 0) {
    check(
      dataKeys.has(era.dataKey),
      `eras: "${era.id}" dataKey "${era.dataKey}" has no block in MAP_HISTORICAL_DATA`,
    );
  }
}

for (const era of ERAS) {
  const map = ERA_MAPS[era.id];
  check(!!map, `historyMaps: no ERA_MAPS entry for era "${era.id}"`);
  if (map) {
    const file = fileURLToPath(new URL(`../public/data/history/${era.id}.geojson`, import.meta.url));
    check(existsSync(file), `historyMaps: public/data/history/${era.id}.geojson missing, run npm run map:history`);
    const { west, south, east, north } = map.view;
    const inView = ([lon, lat]: [number, number]) => lon >= west && lon <= east && lat >= south && lat <= north;
    for (const site of era.sites) {
      check(inView(site.coordinates), `eras: "${site.name}" is outside the "${era.id}" map view`);
    }
    const placeNames = new Set<string>();
    for (const place of map.places) {
      check(inView(place.at), `historyMaps: place "${place.name}" is outside the "${era.id}" map view`);
      check(place.modern.trim().length > 0, `historyMaps: place "${place.name}" (${era.id}) has no modern location`);
      check(!placeNames.has(place.name), `historyMaps: duplicate place "${place.name}" in "${era.id}"`);
      placeNames.add(place.name);
    }
    for (const route of map.routes ?? []) {
      check(route.path.length >= 2, `historyMaps: route "${route.label}" (${era.id}) needs at least two points`);
      check(
        route.path.some(inView),
        `historyMaps: route "${route.label}" never enters the "${era.id}" map view`,
      );
      for (const [lon, lat] of route.path) {
        check(Math.abs(lon) <= 180 && Math.abs(lat) <= 90, `historyMaps: route "${route.label}" has a bad point [${lon}, ${lat}]`);
      }
    }
  }

  const detail = ERA_DETAILS[era.id];
  check(!!detail, `eraDetails: no ERA_DETAILS entry for era "${era.id}"`);
  if (detail) {
    check(detail.events.length > 0, `eraDetails: "${era.id}" has no events`);
    for (const field of ["governance", "capital", "territory", "military", "trade"] as const) {
      check(detail[field].trim().length > 0, `eraDetails: "${era.id}" has an empty ${field}`);
    }
    for (const side of ["north", "south", "east", "west"] as const) {
      check(detail.frontiers[side].trim().length > 0, `eraDetails: "${era.id}" has no ${side} frontier`);
    }
    check(detail.figures.length > 0, `eraDetails: "${era.id}" has no figures`);
  }
}
const HOTSPOT_KINDS = ["capital", "turning", "route", "secret"] as const;
const HOTSPOT_MAX_WORDS = 80;
for (const era of ERAS) {
  const story = ERA_STORIES[era.id];
  check(!!story, `eraStories: no ERA_STORIES entry for era "${era.id}"`);
  const map = ERA_MAPS[era.id];
  if (!story || !map) continue;
  const where = `eraStories "${era.id}"`;
  check(!!story.hook.title.trim() && !!story.hook.summary.trim(), `${where}: empty hook`);
  for (const fact of ["leaders", "size", "goal"] as const) {
    check(story.facts[fact].trim().length > 0, `${where}: empty fact "${fact}"`);
  }
  check(story.hotspots.length >= 4 && story.hotspots.length <= 6, `${where}: needs 4–6 hotspots`);
  for (const kind of HOTSPOT_KINDS) {
    check(story.hotspots.some((h) => h.kind === kind), `${where}: no "${kind}" hotspot`);
  }
  const { west, south, east, north } = map.view;
  for (const hotspot of story.hotspots) {
    const words = hotspot.text.trim().split(/\s+/).length;
    check(words <= HOTSPOT_MAX_WORDS, `${where}: "${hotspot.title}" is ${words} words (max ${HOTSPOT_MAX_WORDS})`);
    check(!!hotspot.place !== !!hotspot.at, `${where}: "${hotspot.title}" needs exactly one of place or at`);
    if (hotspot.place) {
      check(
        map.places.some((p) => p.name === hotspot.place),
        `${where}: "${hotspot.title}" points at unknown place "${hotspot.place}"`,
      );
    }
    if (hotspot.at) {
      const [lon, lat] = hotspot.at;
      check(
        lon >= west && lon <= east && lat >= south && lat <= north,
        `${where}: "${hotspot.title}" is outside the map view`,
      );
    }
  }
  check(story.thenNow.length >= 2 && story.thenNow.length <= 3, `${where}: needs 2–3 then-vs-now bullets`);
  const { options, answer } = story.quiz;
  check(options.length >= 3, `${where}: quiz needs at least three options`);
  check(Number.isInteger(answer) && answer >= 0 && answer < options.length, `${where}: quiz answer out of range`);
  check(new Set(options).size === options.length, `${where}: duplicate quiz options`);
}

for (const id of [...Object.keys(ERA_MAPS), ...Object.keys(ERA_DETAILS), ...Object.keys(ERA_STORIES)]) {
  check(eraIds.has(id), `historyMaps/eraDetails/eraStories: "${id}" is not an era id`);
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
