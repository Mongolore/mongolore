import type { HotspotKind } from "./eraStories";

/**
 * Which animated scene (components/scene/sceneEngine.ts) plays when a story
 * hotspot on /map is opened. `ERA_SCENES[era][i]` is the scene for hotspot
 * `i` of `ERA_STORIES[era].hotspots` — keep the two in the same order. A
 * hotspot without an entry falls back to a scene for its kind.
 */
export type SceneId =
  | "camp"
  | "battle"
  | "charge"
  | "caravan"
  | "courier"
  | "city"
  | "temple"
  | "monument"
  | "migration"
  | "modern-city"
  | "modern-battle"
  | "train"
  | "mine"
  | "square"
  | "ruin"
  | "night-steppe";

export const ERA_SCENES: Record<string, SceneId[]> = {
  khunnu: ["camp", "battle", "caravan", "monument", "monument"],
  turk: ["camp", "charge", "caravan", "monument", "monument"],
  uighur: ["city", "charge", "caravan", "migration", "temple"],
  "great-mongol": ["city", "battle", "courier", "battle", "night-steppe"],
  "northern-yuan": ["city", "battle", "caravan", "temple", "temple"],
  qing: ["temple", "battle", "caravan", "temple"],
  independence: ["temple", "battle", "charge", "night-steppe"],
  "people-republic": ["modern-city", "modern-battle", "ruin", "train", "mine"],
  democracy: ["square", "mine", "train", "night-steppe"],
};

const BY_KIND: Record<HotspotKind, SceneId> = {
  capital: "camp",
  turning: "battle",
  route: "caravan",
  secret: "monument",
};

export function sceneFor(eraId: string, index: number, kind: HotspotKind): SceneId {
  return ERA_SCENES[eraId]?.[index] ?? BY_KIND[kind];
}
