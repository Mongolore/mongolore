import type { NeighbourCode } from "./neighbours";

/**
 * Historical eras for the timeline under the map. Dragging the timeline
 * switches era, which highlights `regions` on the map and shows `sites`.
 *
 * Editing notes:
 * - `regions`: ISO codes from `data/aimags.ts`.
 * - `sites.coordinates`: [longitude, latitude]. These are approximate and
 *   should be checked against a reliable source before launch.
 * - `sites.country`: set when a site lies outside Mongolia, so the map can
 *   highlight the neighbouring country instead.
 * - Eras are shown in array order; keep them chronological.
 */
export type EraSite = {
  name: string;
  coordinates: [number, number];
  country?: NeighbourCode;
};

export type Era = {
  id: string;
  name: string;
  /** Shown on the timeline tick and next to the era name. */
  period: string;
  summary: string;
  regions: string[];
  sites: EraSite[];
};

export const ERAS: Era[] = [
  {
    id: "khunnu",
    name: "Хүннү гүрэн",
    period: "МЭӨ 209",
    summary:
      "Модун шаньюй овог аймгуудыг нэгтгэж, Төв Азид нүүдэлчдийн анхны эзэнт гүрнийг байгуулав.",
    regions: ["MN-047", "MN-073", "MN-049"],
    sites: [
      { name: "Ноён уул", coordinates: [106.75, 48.55] },
      { name: "Гол мод", coordinates: [101.95, 47.95] },
    ],
  },
  {
    id: "turk",
    name: "Түрэгийн хаант улс",
    period: "552–745",
    summary:
      "Орхоны хөндий төв нь болж, Күлтегин, Билгэ хааны гэрэлт хөшөөнд эртний түрэг бичгээр түүхээ үлдээжээ.",
    regions: ["MN-073", "MN-055"],
    sites: [{ name: "Хөшөө цайдам", coordinates: [102.83, 47.56] }],
  },
  {
    id: "uighur",
    name: "Уйгурын хаант улс",
    period: "744–840",
    summary: "Орхон голын хөндийд Хар балгас хотоо нийслэлээ болгов.",
    regions: ["MN-073"],
    sites: [{ name: "Хар балгас", coordinates: [102.65, 47.43] }],
  },
  {
    id: "great-mongol",
    name: "Их Монгол Улс",
    period: "1206–1368",
    summary:
      "Их хуралдайгаар Тэмүүжинг Чингис хаанаар өргөмжилж, улмаар Хархорум нийслэл болов.",
    regions: ["MN-039", "MN-055", "MN-047"],
    sites: [
      { name: "Хөдөө арал", coordinates: [109.45, 47.18] },
      { name: "Хархорум", coordinates: [102.84, 47.2] },
    ],
  },
  {
    id: "northern-yuan",
    name: "Умард Юань",
    period: "1368–1691",
    summary:
      "Монголчууд эх нутагтаа буцаж, Даян хаан улсаа сэргээв. Абтай сайн хан Эрдэнэ зуу хийдийг байгуулав.",
    regions: ["MN-055", "MN-047"],
    sites: [{ name: "Эрдэнэ зуу", coordinates: [102.845, 47.2] }],
  },
  {
    id: "qing",
    name: "Чин улсын үе",
    period: "1691–1911",
    summary:
      "Долоон нуурын чуулганаар Халхын ноёд Чин улсад орж, хожим Амарбаясгалант хийд баригдав.",
    regions: ["MN-049", "MN-047"],
    sites: [
      { name: "Амарбаясгалант", coordinates: [105.08, 49.48] },
      { name: "Долоон нуур", coordinates: [116.49, 42.25], country: "CHN" },
    ],
  },
  {
    id: "independence",
    name: "Үндэсний эрх чөлөө",
    period: "1911–1921",
    summary:
      "Монгол улс тусгаар тогтнолоо зарлаж, VIII Богд Жавзандамба хутагтыг хаанаар өргөмжлөв.",
    regions: ["MN-1", "MN-047"],
    sites: [{ name: "Нийслэл Хүрээ", coordinates: [106.92, 47.92] }],
  },
  {
    id: "people-republic",
    name: "Ардын хувьсгал",
    period: "1921–1990",
    summary:
      "Ардын хувьсгал ялж, Бүгд Найрамдах Монгол Ард Улс тунхаглагдав. 1939 онд Халхын голын дайн болов.",
    regions: ["MN-061", "MN-1"],
    sites: [
      { name: "Халх гол", coordinates: [118.6, 47.72] },
      { name: "Улаанбаатар", coordinates: [106.92, 47.92] },
    ],
  },
  {
    id: "democracy",
    name: "Ардчилал",
    period: "1990–өнөө",
    summary:
      "Ардчилсан хувьсгал өрнөж, 1992 онд шинэ Үндсэн хууль батлагдан олон намын тогтолцоо тогтов.",
    regions: ["MN-1"],
    sites: [{ name: "Сүхбаатарын талбай", coordinates: [106.9176, 47.9185] }],
  },
];
