/**
 * Mongolian names for the 22 ADM1 regions in `public/data/mongolia-aimags.geojson`.
 * Keyed by the `shapeISO` property (ISO 3166-2:MN), which is stable across
 * geoBoundaries releases, unlike the English `shapeName` spellings.
 *
 * `numericId` is the region's id in the historical dataset
 * (`MAP_HISTORICAL_DATA` in `data/aimagInfo.ts`): "209" is Улаанбаатар and
 * "309"…"2209" are the 21 aimags in alphabetical order. Говьсүмбэр has no
 * entry in that dataset yet, so it has no numericId and falls back to the
 * placeholder text in the info card.
 */
export type RegionKind = "aimag" | "capital";

export type Region = {
  iso: string;
  name: string;
  kind: RegionKind;
  /** Numeric id in `MAP_HISTORICAL_DATA` (data/aimagInfo.ts); absent for Говьсүмбэр. */
  numericId?: string;
};

export const REGIONS: Record<string, Region> = {
  "MN-073": { iso: "MN-073", name: "Архангай", kind: "aimag", numericId: "309" },
  "MN-071": { iso: "MN-071", name: "Баян-Өлгий", kind: "aimag", numericId: "409" },
  "MN-069": { iso: "MN-069", name: "Баянхонгор", kind: "aimag", numericId: "509" },
  "MN-067": { iso: "MN-067", name: "Булган", kind: "aimag", numericId: "609" },
  "MN-065": { iso: "MN-065", name: "Говь-Алтай", kind: "aimag", numericId: "709" },
  "MN-064": { iso: "MN-064", name: "Говьсүмбэр", kind: "aimag" },
  "MN-037": { iso: "MN-037", name: "Дархан-Уул", kind: "aimag", numericId: "2109" },
  "MN-063": { iso: "MN-063", name: "Дорноговь", kind: "aimag", numericId: "809" },
  "MN-061": { iso: "MN-061", name: "Дорнод", kind: "aimag", numericId: "909" },
  "MN-059": { iso: "MN-059", name: "Дундговь", kind: "aimag", numericId: "1009" },
  "MN-057": { iso: "MN-057", name: "Завхан", kind: "aimag", numericId: "1109" },
  "MN-035": { iso: "MN-035", name: "Орхон", kind: "aimag", numericId: "2209" },
  "MN-055": { iso: "MN-055", name: "Өвөрхангай", kind: "aimag", numericId: "1209" },
  "MN-053": { iso: "MN-053", name: "Өмнөговь", kind: "aimag", numericId: "1309" },
  "MN-051": { iso: "MN-051", name: "Сүхбаатар", kind: "aimag", numericId: "1409" },
  "MN-049": { iso: "MN-049", name: "Сэлэнгэ", kind: "aimag", numericId: "1509" },
  "MN-047": { iso: "MN-047", name: "Төв", kind: "aimag", numericId: "1609" },
  "MN-046": { iso: "MN-046", name: "Увс", kind: "aimag", numericId: "1709" },
  "MN-043": { iso: "MN-043", name: "Ховд", kind: "aimag", numericId: "1809" },
  "MN-041": { iso: "MN-041", name: "Хөвсгөл", kind: "aimag", numericId: "1909" },
  "MN-039": { iso: "MN-039", name: "Хэнтий", kind: "aimag", numericId: "2009" },
  "MN-1": { iso: "MN-1", name: "Улаанбаатар", kind: "capital", numericId: "209" },
};

export const REGION_KIND_LABEL: Record<RegionKind, string> = {
  aimag: "Аймаг",
  capital: "Нийслэл",
};
