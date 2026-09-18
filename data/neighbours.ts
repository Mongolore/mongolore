/**
 * Neighbouring countries drawn behind Mongolia for geographic context.
 * Codes match the `ADM0_A3` property in `public/data/neighbours.geojson`.
 * `label` is [longitude, latitude] for the country name on the map; countries
 * without one are drawn but not labelled.
 */
export type NeighbourCode = "RUS" | "CHN" | "KAZ" | "KGZ" | "PRK" | "KOR";

export type Neighbour = {
  name: string;
  label?: [number, number];
};

export const NEIGHBOURS: Record<NeighbourCode, Neighbour> = {
  RUS: { name: "ОРОС", label: [99, 53.6] },
  CHN: { name: "ХЯТАД", label: [108, 41.2] },
  KAZ: { name: "КАЗАХСТАН", label: [84.5, 48.2] },
  KGZ: { name: "Киргиз" },
  PRK: { name: "Хойд Солонгос" },
  KOR: { name: "Өмнөд Солонгос" },
};
