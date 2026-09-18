/**
 * Mongolian names for the 22 ADM1 regions in `public/data/mongolia-aimags.geojson`.
 * Keyed by the `shapeISO` property (ISO 3166-2:MN), which is stable across
 * geoBoundaries releases, unlike the English `shapeName` spellings.
 */
export type RegionKind = "aimag" | "capital";

export type Region = {
  iso: string;
  name: string;
  kind: RegionKind;
};

export const REGIONS: Record<string, Region> = {
  "MN-073": { iso: "MN-073", name: "Архангай", kind: "aimag" },
  "MN-071": { iso: "MN-071", name: "Баян-Өлгий", kind: "aimag" },
  "MN-069": { iso: "MN-069", name: "Баянхонгор", kind: "aimag" },
  "MN-067": { iso: "MN-067", name: "Булган", kind: "aimag" },
  "MN-065": { iso: "MN-065", name: "Говь-Алтай", kind: "aimag" },
  "MN-064": { iso: "MN-064", name: "Говьсүмбэр", kind: "aimag" },
  "MN-037": { iso: "MN-037", name: "Дархан-Уул", kind: "aimag" },
  "MN-063": { iso: "MN-063", name: "Дорноговь", kind: "aimag" },
  "MN-061": { iso: "MN-061", name: "Дорнод", kind: "aimag" },
  "MN-059": { iso: "MN-059", name: "Дундговь", kind: "aimag" },
  "MN-057": { iso: "MN-057", name: "Завхан", kind: "aimag" },
  "MN-035": { iso: "MN-035", name: "Орхон", kind: "aimag" },
  "MN-055": { iso: "MN-055", name: "Өвөрхангай", kind: "aimag" },
  "MN-053": { iso: "MN-053", name: "Өмнөговь", kind: "aimag" },
  "MN-051": { iso: "MN-051", name: "Сүхбаатар", kind: "aimag" },
  "MN-049": { iso: "MN-049", name: "Сэлэнгэ", kind: "aimag" },
  "MN-047": { iso: "MN-047", name: "Төв", kind: "aimag" },
  "MN-046": { iso: "MN-046", name: "Увс", kind: "aimag" },
  "MN-043": { iso: "MN-043", name: "Ховд", kind: "aimag" },
  "MN-041": { iso: "MN-041", name: "Хөвсгөл", kind: "aimag" },
  "MN-039": { iso: "MN-039", name: "Хэнтий", kind: "aimag" },
  "MN-1": { iso: "MN-1", name: "Улаанбаатар", kind: "capital" },
};

export const REGION_KIND_LABEL: Record<RegionKind, string> = {
  aimag: "Аймаг",
  capital: "Нийслэл",
};
