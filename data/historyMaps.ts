/**
 * Historical borders drawn on the map for each era in `data/eras.ts`.
 *
 * Borders come from the historical-basemaps dataset
 * (https://github.com/aourednik/historical-basemaps, GPL-3.0), which has one
 * world snapshot per year. `npm run map:history` downloads the snapshot named
 * in `source`, clips it to the era's `view` and writes
 * `public/data/history/<era id>.geojson`. Re-run it after editing this file.
 *
 * Editing notes:
 * - `polities` keys are the snapshot's English `NAME` values. Only listed
 *   polities are coloured or labelled; everything else is drawn as plain land.
 *   The dataset has a few wrong names (e.g. "Sui Empire" in 700, when the Tang
 *   ruled China), so labels here are what the map shows, not a translation.
 * - `role`: "realm" is the era's Mongolian state, "ally" its sister khanates
 *   or vassals, "ruler" a foreign empire that ruled Mongolia, "other" a
 *   neighbour shown for context.
 * - `realm: "modern"` fills today's Mongolia (geoBoundaries outline) as the
 *   realm instead of a snapshot polygon — used once the borders match today's.
 * - `derive` cuts a realm out of a snapshot polygon that the dataset lumps
 *   together with a neighbour (see the Northern Yuan entry).
 * - `regionLabels` are small italic labels for historical regions, [lon, lat].
 * - `places`: capitals, ordos, battles and landmarks drawn as symbols. `name`
 *   is the era's own name for the place; `modern` anchors it to today's map
 *   ("одоогийн Хархорин, Өвөрхангай"). `npm run check:data` checks each one
 *   lies inside `view`.
 * - `routes`: trade roads, relay (yam) lines, campaigns and migrations, as
 *   [lon, lat] waypoints. Lines may run past the frame; the map clips them.
 * - Borders in the dataset are approximate (BORDERPRECISION 1 before the
 *   1650s); the map says so next to the snapshot year. Places and routes are
 *   placed from the sources in the details text, rounded to ~0.1°; where a
 *   site is disputed `modern` says "ойролцоо".
 */
export type PolityRole = "realm" | "ally" | "ruler" | "other";

export type Polity = {
  role: PolityRole;
  /** Mongolian label; omit to colour the polity without labelling it. */
  label?: string;
  /** [lon, lat] for the label when the polygon's centre is a poor spot. */
  labelAt?: [number, number];
};

export type ViewWindow = { west: number; south: number; east: number; north: number };

export type LonLat = [number, number];

export type PlaceKind = "capital" | "ordo" | "city" | "fortress" | "battle" | "monument";

export type Place = {
  /** The era's own name for the place. */
  name: string;
  /** Where it is on today's map, as a spatial anchor. */
  modern: string;
  kind: PlaceKind;
  at: LonLat;
  /** Year of the battle, founding or event the place is shown for. */
  year?: string;
};

export type RouteKind = "trade" | "yam" | "campaign" | "migration" | "journey";

export type Route = {
  label: string;
  kind: RouteKind;
  path: LonLat[];
};

export type Landform = {
  label: string;
  kind: "mountains" | "desert" | "lake";
  at: LonLat;
};

export type EraMap = {
  /** historical-basemaps snapshot: "bc200" is 200 BC, "1279" is AD 1279. */
  source: string;
  /** The year the borders are drawn for, as shown on the map. */
  snapshot: string;
  /** Lon/lat window the map is framed on. */
  view: ViewWindow;
  polities: Record<string, Polity>;
  /** Fill today's Mongolia as the realm, labelled with this text. */
  modernRealm?: { label: string; labelAt?: [number, number] };
  /**
   * Cut `from` into two: the part inside `mask` (a lon/lat polygon) becomes
   * `inside`, and the largest piece left outside it becomes `outside`.
   */
  derive?: {
    from: string;
    mask: [number, number][];
    inside: Polity;
    outside: Polity;
  };
  regionLabels?: { label: string; at: [number, number] }[];
  places: Place[];
  routes?: Route[];
  /** Shown under the map: what the borders mean and where they are uncertain. */
  note: string;
};

export const HISTORY_SOURCE = {
  name: "historical-basemaps (A. Ourednik)",
  url: "https://github.com/aourednik/historical-basemaps",
  license: "GPL-3.0",
};

export const HYDRO_SOURCE = {
  name: "Natural Earth",
  url: "https://www.naturalearthdata.com/",
};

/**
 * Mountain ranges, deserts and lakes labelled on every era's map (hidden on
 * continent-wide views, where they would crowd the Mongolian plateau).
 */
export const LANDFORMS: Landform[] = [
  { label: "Алтайн нуруу", kind: "mountains", at: [93.6, 46.3] },
  { label: "Хангайн нуруу", kind: "mountains", at: [99.4, 47.2] },
  { label: "Хэнтийн нуруу", kind: "mountains", at: [109.4, 48.9] },
  { label: "Саяны нуруу", kind: "mountains", at: [99, 52.7] },
  { label: "Их Хянганы нуруу", kind: "mountains", at: [121.4, 48.6] },
  { label: "Тэнгэр уул", kind: "mountains", at: [82.5, 42.3] },
  { label: "Говь", kind: "desert", at: [102.6, 43.3] },
  { label: "Байгал нуур", kind: "lake", at: [110.2, 54.3] },
];

/** Keyed by `Era.id`. `npm run check:data` checks every era has an entry. */
export const ERA_MAPS: Record<string, EraMap> = {
  khunnu: {
    source: "bc200",
    snapshot: "МЭӨ 200 он",
    view: { west: 76, south: 30, east: 138, north: 57 },
    polities: {
      Xiongnu: { role: "realm", label: "Хүннү гүрэн" },
      "Han Empire": { role: "other", label: "Хань улс" },
      Yuezhi: { role: "other", label: "Юэчжи" },
    },
    regionLabels: [
      { label: "Дунху", at: [119.5, 44.8] },
      { label: "Динлин", at: [100, 54.5] },
    ],
    places: [
      { name: "Гол мод", modern: "Хайрхан сум, Архангай — шаньюйн язгууртны булш", kind: "monument", at: [101.95, 47.95] },
      { name: "Ноён уул", modern: "Батсүмбэр сум, Төв — язгууртны булш", kind: "monument", at: [106.75, 48.55] },
      { name: "Байдэн", modern: "одоогийн Датун орчим, Шаньси", kind: "battle", at: [113.3, 40.1], year: "МЭӨ 200" },
      { name: "Яньжаны бичээс", modern: "Дэлгэрхангай уул, Дундговь (ойролцоо)", kind: "monument", at: [104.9, 45.25], year: "МЭ 89" },
      { name: "Чанъань", modern: "одоогийн Сиань — Хань улсын нийслэл", kind: "city", at: [108.94, 34.34] },
      { name: "Дуньхуан", modern: "Дуньхуан, Ганьсу — Хэсийн хонгилын үзүүр", kind: "city", at: [94.66, 40.14] },
    ],
    routes: [
      { label: "Дунхугийн эсрэг аян (МЭӨ 206 орчим)", kind: "campaign", path: [[106.5, 47.8], [112, 47], [118.5, 44]] },
      { label: "Юэчжийн эсрэг баруун аян (МЭӨ 176)", kind: "campaign", path: [[103, 47.5], [99, 44.5], [97, 41.5], [94.66, 40.14]] },
      { label: "Хань улсын Мобэйн аян (МЭӨ 119)", kind: "campaign", path: [[111.5, 40.8], [110.5, 44], [109.5, 47.5]] },
      { label: "Хэчин алба, хилийн зах", kind: "trade", path: [[108.94, 34.34], [110.5, 37.5], [112.5, 40.2], [111, 42.5], [106.5, 46.5]] },
      { label: "Хэсийн хонгил — баруун зүгийн зам", kind: "trade", path: [[108.94, 34.34], [103.8, 36.06], [100.45, 38.93], [94.66, 40.14], [89.2, 42.9], [82.96, 41.72]] },
    ],
    note:
      "Модун шаньюйн эхэн үеийн хил. МЭӨ 176 оны орчим Юэчжийг ялж, баруун зүгт Таримын сав хүртэл нөлөөгөө тэлсэн нь энд тусаагүй.",
  },
  turk: {
    source: "700",
    snapshot: "700 он орчим",
    view: { west: 48, south: 28, east: 140, north: 57 },
    polities: {
      Göktürks: { role: "realm", label: "Түрэгийн хаант улс" },
      "Western Gokturk Khaganate": { role: "ally", label: "Баруун Түрэг" },
      // The dataset keeps the Sui name in 700; the Tang ruled China from 618.
      "Sui Empire": { role: "other", label: "Тан улс" },
      "Tufan Empire": { role: "other", label: "Төвд" },
    },
    regionLabels: [
      { label: "Кыргыз", at: [91.5, 54] },
      { label: "Кидан", at: [121, 43] },
      { label: "Согд", at: [64.5, 40.8] },
    ],
    places: [
      { name: "Өтүкэн ыш", modern: "Хангайн нуруу, Орхоны эх орчим", kind: "ordo", at: [101.4, 47.3] },
      { name: "Хөшөө цайдам", modern: "Хашаат сум, Архангай — Күлтегин, Билгэ хааны хөшөө", kind: "monument", at: [102.83, 47.56], year: "732, 735" },
      { name: "Тоньюкукийн хөшөө", modern: "Налайх орчим, Улаанбаатар", kind: "monument", at: [107.48, 47.69] },
      { name: "Суяб", modern: "Токмок орчим, Киргиз — Баруун Түрэгийн орд", kind: "ordo", at: [75.2, 42.8] },
      { name: "Чанъань", modern: "одоогийн Сиань — Тан улсын нийслэл", kind: "city", at: [108.94, 34.34] },
      { name: "Самарканд", modern: "Самарканд, Узбекистан — Согдын худалдааны төв", kind: "city", at: [66.97, 39.65] },
      { name: "Төмөр хаалга", modern: "Бузгала хавцал, Узбекистан", kind: "battle", at: [67.1, 38.4], year: "712–713" },
    ],
    routes: [
      { label: "Торгоны зам", kind: "trade", path: [[108.94, 34.34], [103.8, 36.06], [100.45, 38.93], [94.66, 40.14], [89.2, 42.9], [82.96, 41.72], [78.3, 41.6], [75.2, 42.8], [71.4, 42.9], [69.2, 41.3], [66.97, 39.65]] },
      { label: "Тоньюкукийн Кыргызын аян (710–711)", kind: "campaign", path: [[102.5, 47.6], [98, 49.8], [93.5, 51.8], [92, 53.5]] },
      { label: "Төмөр хаалга хүртэлх аян (712–713)", kind: "campaign", path: [[102.5, 47.6], [93, 46], [85, 45.5], [76, 43.5], [69.2, 41.3], [67.1, 38.4]] },
    ],
    note:
      "Хоёрдугаар Түрэгийн хаант улс (682–744). 552–583 оны нэгдсэн хаант улс баруун тийш Хар тэнгис хүрч байсан бол 583 оноос Зүүн, Баруун хэмээн хуваагджээ.",
  },
  uighur: {
    source: "800",
    snapshot: "800 он орчим",
    view: { west: 58, south: 28, east: 140, north: 57 },
    polities: {
      Uyghurs: { role: "realm", label: "Уйгурын хаант улс" },
      "Tang Empire": { role: "other", label: "Тан улс" },
      "Tibetan Empire": { role: "other", label: "Төвдийн эзэнт гүрэн" },
      Parhae: { role: "other", label: "Бохай" },
    },
    regionLabels: [{ label: "Кыргыз", at: [91.5, 54] }],
    places: [
      { name: "Хар балгас (Ордубалык)", modern: "Хотонт сум, Архангай", kind: "capital", at: [102.65, 47.43] },
      { name: "Бэшбалык", modern: "Жимсар орчим, Шинжаан", kind: "battle", at: [89.18, 44.1], year: "789–792" },
      { name: "Кочо", modern: "Турфан орчим, Шинжаан — 840 оноос Уйгурын төв", kind: "city", at: [89.53, 42.85] },
      { name: "Ганьжоу", modern: "Жанъе, Ганьсу", kind: "city", at: [100.45, 38.93] },
      { name: "Чанъань", modern: "одоогийн Сиань — Тан улсын нийслэл", kind: "city", at: [108.94, 34.34] },
      { name: "Лоян", modern: "Лоян, Хэнань", kind: "battle", at: [112.45, 34.62], year: "757" },
    ],
    routes: [
      { label: "Морь–торгоны худалдаа", kind: "trade", path: [[102.65, 47.43], [106, 44], [109, 40.6], [108.94, 34.34]] },
      { label: "Ань Лушаний бослогыг дарах аян (757)", kind: "campaign", path: [[102.65, 47.43], [107, 42.5], [109.5, 38], [108.94, 34.34], [112.45, 34.62]] },
      { label: "Кыргызын довтолгоо (840)", kind: "campaign", path: [[92, 53.5], [97, 50.5], [102.65, 47.43]] },
      { label: "Уйгурын нүүдэл — Ганьсу руу (840)", kind: "migration", path: [[102.65, 47.43], [100.5, 44], [100.45, 38.93]] },
      { label: "Уйгурын нүүдэл — Турфан руу (840)", kind: "migration", path: [[102.65, 47.43], [96, 45.5], [91, 43.8], [89.53, 42.85]] },
    ],
    note: "Уйгурын хаант улсын оргил үеийн ойролцоо хил.",
  },
  "great-mongol": {
    source: "1279",
    snapshot: "1279 он",
    view: { west: 18, south: 12, east: 146, north: 64 },
    polities: {
      "Great Khanate": { role: "realm", label: "Их Юань улс", labelAt: [110, 36] },
      "Chagatai Khanate": { role: "realm", label: "Цагаадайн улс", labelAt: [72.5, 38.8] },
      "Khanate of the Golden Horde": { role: "realm", label: "Зүчийн улс (Алтан Орд)" },
      Ilkhanate: { role: "realm", label: "Хүлэгүийн улс" },
      Tibet: { role: "ally", label: "Төвд" },
      Ryazan: { role: "ally", label: "Орос ноёдууд" },
      Novgorod: { role: "ally" },
      "Seljuk Caliphate": { role: "ally" },
      "Mamluke Sultanate": { role: "other", label: "Мамлюк" },
      "Sultanate of Delhi": { role: "other", label: "Делийн султант улс" },
      "Shogun Japan (Kamakura)": { role: "other", label: "Япон" },
    },
    places: [
      { name: "Хөдөө арал", modern: "Дэлгэрхаан сум, Хэнтий — Их ордны нутаг", kind: "ordo", at: [109.45, 47.18] },
      { name: "Хархорум", modern: "Хархорин сум, Өвөрхангай", kind: "capital", at: [102.84, 47.2], year: "1235" },
      { name: "Хаанбалиг (Даду)", modern: "Бээжин", kind: "capital", at: [116.39, 39.91], year: "1272" },
      { name: "Шанду", modern: "Шилийн гол, Өвөр Монгол — зуны нийслэл", kind: "capital", at: [116.18, 42.36] },
      { name: "Алмалык", modern: "Хоргос орчим, Шинжаан — Цагаадайн улсын төв", kind: "ordo", at: [80.9, 44] },
      { name: "Сарай", modern: "Селитренное орчим, Астрахань — Алтан Ордын нийслэл", kind: "capital", at: [47.13, 46.63] },
      { name: "Тэбриз", modern: "Тебриз, Иран — Хүлэгүийн улсын нийслэл", kind: "capital", at: [46.29, 38.08] },
      { name: "Отрар", modern: "Туркестан орчим, Казахстан", kind: "battle", at: [68.3, 42.85], year: "1219" },
      { name: "Калка", modern: "Донецк орчим, Украин", kind: "battle", at: [37.6, 47.2], year: "1223" },
      { name: "Мохи", modern: "Шайо гол, Унгар", kind: "battle", at: [20.95, 47.97], year: "1241" },
      { name: "Багдад", modern: "Багдад, Ирак", kind: "battle", at: [44.37, 33.31], year: "1258" },
      { name: "Айн Жалут", modern: "Изреелийн хөндий, Израиль", kind: "battle", at: [35.35, 32.55], year: "1260" },
      { name: "Шянъян", modern: "Шянъян, Хубэй", kind: "battle", at: [112.14, 32.04], year: "1268–1273" },
      { name: "Хаката", modern: "Фукуока, Япон", kind: "battle", at: [130.4, 33.6], year: "1274, 1281" },
    ],
    routes: [
      { label: "Өртөөний гол зам: Хаанбалиг — Хархорум — Тэбриз", kind: "yam", path: [[116.39, 39.91], [116.18, 42.36], [110.5, 45], [102.84, 47.2], [96, 47.5], [88, 46], [80.9, 44], [72.5, 42.9], [66.97, 39.65], [61.83, 37.66], [58.8, 36.2], [51.4, 35.6], [46.29, 38.08]] },
      { label: "Өртөөний зам: Хархорум — Сарай", kind: "yam", path: [[102.84, 47.2], [92, 48.5], [84, 47.5], [73, 46.5], [64, 47.5], [53, 47.5], [47.13, 46.63]] },
      { label: "Хорезмын аян (1219–1221)", kind: "campaign", path: [[102.84, 47.2], [90, 47], [81, 46.5], [68.3, 42.85], [64.42, 39.77], [66.97, 39.65], [59.15, 42.33]] },
      { label: "Зэв, Сүбээдэйн аян (1220–1223)", kind: "campaign", path: [[66.97, 39.65], [58.8, 36.2], [51.4, 35.6], [46.3, 38.1], [44.8, 41.7], [48.29, 42.06], [40, 45], [37.6, 47.2]] },
      { label: "Батын баруун аян (1236–1242)", kind: "campaign", path: [[49.06, 54.98], [39.7, 54.6], [40.4, 56.1], [30.52, 50.45], [24, 49.5], [20.95, 47.97]] },
      { label: "Хүлэгүгийн аян (1256–1260)", kind: "campaign", path: [[66.97, 39.65], [58.8, 36.2], [50.59, 36.44], [48.5, 34.8], [44.37, 33.31], [37.16, 36.2], [36.3, 33.5], [35.35, 32.55]] },
      { label: "Өмнөд Сүнийг эзлэх аян (1268–1279)", kind: "campaign", path: [[116.39, 39.91], [114, 35], [112.14, 32.04], [114.3, 30.6], [120.15, 30.27], [113.07, 22.2]] },
      { label: "Японы аян (1274, 1281)", kind: "campaign", path: [[128.57, 35.2], [129.7, 34.3], [130.4, 33.6]] },
    ],
    note:
      "1279 онд Өмнөд Сүнийг эзэлснээр эзэнт гүрэн хамгийн том хэмжээндээ хүрэв. Энэ үед дөрвөн улс (Юань, Цагаадай, Зүчи, Хүлэгү) бодитоор бие даасан ч Их хааныг нэрлэсэн байдлаар хүлээн зөвшөөрдөг байв. Цайвар өнгөөр вассал орнуудыг тэмдэглэв.",
  },
  "northern-yuan": {
    source: "1500",
    snapshot: "1500 он орчим",
    view: { west: 72, south: 30, east: 136, north: 57 },
    polities: {
      "Ming Chinese Empire": { role: "other", label: "Мин улс" },
      "Khanate of Sibir": { role: "other", label: "Сибирийн ханлиг" },
      Korea: { role: "other", label: "Чосон" },
    },
    // The dataset draws Mongolia and Moghulistan as one "Chagatai Khanate"
    // polygon in 1500. The mask keeps the Mongol lands: the Oirat country in
    // Dzungaria and the Altai (west edge along the Tarbagatai and the Tian Shan
    // foothills), the Baikal lands to the north, and east to the Argun and
    // Nonni rivers below the Greater Khingan.
    derive: {
      from: "Chagatai Khanate",
      mask: [
        [80.5, 47.5],
        [80.5, 51.5],
        [90, 52],
        [100, 53],
        [109, 55.8],
        [117, 54.5],
        [121.5, 53.3],
        [123, 50.5],
        [124.8, 47.5],
        [124, 45],
        [122.5, 43],
        [121, 30],
        [97, 30],
        [96.5, 42.3],
        [93.5, 43.3],
        [89, 43.7],
        [86, 44.3],
        [82.8, 45.2],
        [80.5, 47.5],
      ],
      inside: { role: "realm", label: "Умард Юань", labelAt: [107, 46] },
      outside: { role: "other", label: "Моголистан" },
    },
    regionLabels: [
      { label: "Ойрад", at: [90.5, 47.3] },
      { label: "Зургаан түмэн", at: [111, 43.8] },
      // The dataset lumps the Amur lands into the same polygon; in 1500 they
      // were Jurchen country, drawn here as an unlabelled neighbour.
      { label: "Зүрчид", at: [128, 46.5] },
    ],
    places: [
      { name: "Эрдэнэ зуу", modern: "Хархорин сум, Өвөрхангай — хуучин Хархорумын туурь дээр", kind: "monument", at: [102.845, 47.2], year: "1585" },
      { name: "Хөх хот", modern: "Хөх хот, Өвөр Монгол", kind: "capital", at: [111.67, 40.82], year: "1572" },
      { name: "Ил голын орд", modern: "Кульджа (Инин), Шинжаан — Зүүнгарын хаадын төв", kind: "ordo", at: [81.3, 43.9] },
      { name: "Буйр нуур", modern: "Буйр нуур, Дорнод", kind: "battle", at: [117.7, 47.8], year: "1388" },
      { name: "Түмү", modern: "Хуайлай орчим, Хэбэй", kind: "battle", at: [115.53, 40.37], year: "1449" },
      { name: "Бээжин", modern: "Бээжин — Мин улсын нийслэл (1421 оноос)", kind: "city", at: [116.39, 39.91] },
      { name: "Цавчаал", modern: "Хөх нуур орчим, Цинхай", kind: "monument", at: [100.2, 36.9], year: "1578" },
    ],
    routes: [
      { label: "Хилийн морин зах (1571 оноос)", kind: "trade", path: [[111.67, 40.82], [113.3, 40.1], [115, 40.6], [116.39, 39.91]] },
      { label: "Эсэн тайшийн аян (1449)", kind: "campaign", path: [[88, 47], [97, 46], [106, 44], [112, 41.5], [115.53, 40.37]] },
      { label: "Галдан бошогтын Халхын аян (1688)", kind: "campaign", path: [[81.3, 43.9], [88, 46.5], [95, 47.5], [102.845, 47.2], [108, 47.4], [112, 47.5]] },
      { label: "Халхын ноёдын өмнө зүг дүрвэлт (1688)", kind: "migration", path: [[106.9, 47.9], [110, 45.2], [113.5, 43.2]] },
      { label: "Торгуудын Ижил рүү нүүдэл (1630 орчим)", kind: "migration", path: [[85, 47], [76, 48.5], [66, 49], [55, 48.5], [47, 47.5]] },
      { label: "Алтан хааны Цавчаалд морилсон нь (1578)", kind: "journey", path: [[111.67, 40.82], [106, 38.5], [102, 37.3], [100.2, 36.9]] },
    ],
    note:
      "Өгөгдлийн сангийн 1500 оны хилээс Алтайгаас Их Хянган хүртэлх Монгол нутгийг ялгаж зурав. Баруун, зүүн хил нь ойролцоо. 1636 онд Өвөр Монгол, 1691 онд Халх Манжид дагаар орсон.",
  },
  qing: {
    source: "1800",
    snapshot: "1800 он",
    view: { west: 70, south: 18, east: 140, north: 57 },
    polities: {
      "Russian Empire": { role: "other", label: "Оросын эзэнт гүрэн", labelAt: [100, 55] },
      Korea: { role: "other", label: "Чосон" },
    },
    // The dataset draws the whole Qing realm as one polygon. The mask cuts
    // out Outer Mongolia as the Qing administered it: the four Khalkha
    // aimags, the Khovd frontier with the Altai district (to the Black Irtysh,
    // split off in the 1900s) and Tannu Uriankhai under the Uliastai general.
    // East it stops at the Khalkha–Barga line (Khalkh gol, Buir nuur); south
    // it follows the Gobi line between the Khalkha aimags and the Inner
    // Mongolian leagues, which today's border inherited. North and west it
    // overshoots, since there the Qing polygon already ends at Russia.
    derive: {
      from: "Qing Empire",
      mask: [
        [85.5, 48.3],
        [85.5, 53],
        [100, 56.5],
        [116, 56.5],
        [116.7, 49.85],
        [117.1, 48.5],
        [117.6, 47.9],
        [118.6, 47.9],
        [119.7, 47.2],
        [119.9, 46.7],
        [118.5, 46.7],
        [117.4, 46.4],
        [116, 45.7],
        [114, 44.9],
        [111.9, 43.7],
        [110, 42.6],
        [107.5, 42.4],
        [105, 41.6],
        [100.8, 42.6],
        [96.4, 42.8],
        [95.3, 44],
        [93.5, 44.9],
        [91, 45.2],
        [90, 45.7],
        [88.5, 46.3],
        [87, 46.9],
        [85.8, 47.4],
        [85.5, 48.3],
      ],
      inside: { role: "realm", label: "Гадаад Монгол", labelAt: [102, 46.6] },
      outside: { role: "ruler", label: "Чин улс", labelAt: [110, 30] },
    },
    regionLabels: [
      { label: "Тагна Урианхай", at: [94.5, 51.4] },
      { label: "Өвөр Монгол", at: [113, 43] },
      { label: "Шинжаан", at: [85, 42.5] },
      { label: "Төвд", at: [88, 32] },
    ],
    places: [
      { name: "Их Хүрээ", modern: "Улаанбаатар — Жавзандамбын өргөө, амбаны суудал", kind: "capital", at: [106.92, 47.92] },
      { name: "Улиастай", modern: "Улиастай, Завхан — жанжны цайз", kind: "fortress", at: [96.84, 47.74] },
      { name: "Ховд", modern: "Ховд хот — хязгаарын сайдын цайз", kind: "fortress", at: [91.64, 48.01] },
      { name: "Хиагт — Маймаа хот", modern: "Хиагт (ОХУ) ба Алтанбулаг, Сэлэнгэ", kind: "city", at: [106.47, 50.33], year: "1727" },
      { name: "Амарбаясгалант", modern: "Баруунбүрэн сум, Сэлэнгэ", kind: "monument", at: [105.08, 49.48], year: "1727–1736" },
      { name: "Долоон нуур", modern: "Долоннуур, Өвөр Монгол", kind: "monument", at: [116.49, 42.25], year: "1691" },
      { name: "Улаан бутан", modern: "Хэшигтэн хошуу, Өвөр Монгол (ойролцоо)", kind: "battle", at: [117.6, 42.7], year: "1690" },
      { name: "Зуун мод", modern: "Тэрэлж орчим, Төв аймаг (ойролцоо)", kind: "battle", at: [107.35, 47.85], year: "1696" },
      { name: "Калган", modern: "Чжанцзякоу, Хэбэй — Цайны замын өмнөд боомт", kind: "city", at: [114.88, 40.82] },
      { name: "Бээжин", modern: "Бээжин — Чин улсын нийслэл", kind: "capital", at: [116.39, 39.91] },
      { name: "Ил голын орд", modern: "Кульджа (Инин), Шинжаан — Зүүнгарын төв, 1755 онд эзлэгдэв", kind: "ordo", at: [81.3, 43.9] },
    ],
    routes: [
      { label: "Цайны зам: Калган — Их Хүрээ — Хиагт", kind: "trade", path: [[114.88, 40.82], [112, 43.6], [110.5, 45.1], [106.92, 47.92], [106.47, 50.33], [104.3, 52.29]] },
      { label: "Цэргийн өртөө: Калган — Улиастай — Ховд", kind: "yam", path: [[114.88, 40.82], [111, 42.5], [106.5, 44.5], [101.5, 46.2], [96.84, 47.74], [91.64, 48.01]] },
      { label: "Энх-Амгалан хааны Галдангийн эсрэг аян (1696)", kind: "campaign", path: [[116.39, 39.91], [116.3, 42.5], [115, 45.5], [112.5, 47.4], [107.35, 47.85]] },
      { label: "Зүүнгарыг эзэлсэн аян (1755)", kind: "campaign", path: [[96.84, 47.74], [91.64, 48.01], [86.5, 45.5], [81.3, 43.9]] },
      { label: "Торгуудын нутаг буцалт (1771)", kind: "migration", path: [[47, 47.5], [58, 48], [70, 47], [78, 45], [81.3, 43.9]] },
    ],
    note:
      "Өгөгдлийн сан Чин улсыг нэг хилээр зурдаг тул Гадаад Монголыг Чин улсын үеийн захиргааны хуваариар (Халхын дөрвөн аймаг, Алтайн тойрог бүхий Ховдын хязгаар, Тагна Урианхай) ялгаж зурав. Өмнөд, баруун хил нь ойролцоо.",
  },
  independence: {
    source: "1914",
    snapshot: "1914 он",
    view: { west: 80, south: 35, east: 128, north: 56 },
    polities: {
      Mongolia: { role: "realm", label: "Богд хаант Монгол Улс", labelAt: [102, 46.6] },
      // Named "Manchu Empire" in the dataset; the Republic of China replaced the Qing in 1912.
      "Manchu Empire": { role: "other", label: "Дундад Иргэн Улс", labelAt: [112, 37] },
      Xinjiang: { role: "other", label: "Шинжаан" },
      "Russian Empire": { role: "other", label: "Оросын эзэнт гүрэн", labelAt: [104, 54] },
    },
    regionLabels: [
      { label: "Өвөр Монгол", at: [113, 43] },
      { label: "Урианхай", at: [94.5, 51.8] },
      { label: "Барга", at: [119.5, 49.9] },
    ],
    places: [
      { name: "Нийслэл Хүрээ", modern: "Улаанбаатар", kind: "capital", at: [106.92, 47.92] },
      { name: "Ховд", modern: "Ховд хот", kind: "battle", at: [91.64, 48.01], year: "1912" },
      { name: "Улиастай", modern: "Улиастай, Завхан", kind: "fortress", at: [96.84, 47.74] },
      { name: "Хиагт — Маймаа хот", modern: "Хиагт (ОХУ) ба Алтанбулаг, Сэлэнгэ", kind: "battle", at: [106.47, 50.33], year: "1915, 1921" },
      { name: "Хайлаар", modern: "Хайлаар, Хөлөнбуйр — Баргын төв", kind: "city", at: [119.7, 49.2] },
      { name: "Калган", modern: "Чжанцзякоу, Хэбэй", kind: "city", at: [114.88, 40.82] },
    ],
    routes: [
      { label: "Цайны зам: Калган — Хүрээ — Хиагт", kind: "trade", path: [[114.88, 40.82], [112, 43.6], [110.5, 45.1], [106.92, 47.92], [106.47, 50.33]] },
      { label: "Ховдыг чөлөөлөх аян (1912)", kind: "campaign", path: [[96.84, 47.74], [94, 47.9], [91.64, 48.01]] },
      { label: "Өвөр Монголыг чөлөөлөх аян (1913)", kind: "campaign", path: [[106.92, 47.92], [110.5, 45], [113.5, 43.3], [116, 42.3]] },
      { label: "Унгерны довтолгоо (1920–1921)", kind: "campaign", path: [[113.5, 52], [113, 50.1], [110.5, 48.5], [106.92, 47.92]] },
      { label: "Ардын цэргийн аян (1921)", kind: "campaign", path: [[106.47, 50.33], [106.3, 49.2], [106.92, 47.92]] },
    ],
    note:
      "1915 оны Хиагтын гэрээгээр Гадаад Монгол Дундад Иргэн Улсын дэргэдэх автономи гэж тогтов. Урианхайн хязгаар 1914 онд Оросын ивээлд оров. Барга 1912–1915 онд Богд хаант улсад нэгдэж байсан нь энд тусаагүй.",
  },
  "people-republic": {
    source: "1960",
    snapshot: "1960 он",
    view: { west: 80, south: 35, east: 128, north: 56 },
    polities: {
      China: { role: "other", label: "БНХАУ", labelAt: [112, 37] },
      USSR: { role: "other", label: "ЗХУ", labelAt: [104, 54] },
    },
    modernRealm: { label: "БНМАУ" },
    places: [
      { name: "Улаанбаатар", modern: "Улаанбаатар", kind: "capital", at: [106.92, 47.92] },
      { name: "Халх гол", modern: "Халх гол сум, Дорнод", kind: "battle", at: [118.6, 47.72], year: "1939" },
      { name: "Дархан", modern: "Дархан-Уул", kind: "city", at: [105.95, 49.47], year: "1961" },
      { name: "Эрдэнэт", modern: "Орхон аймаг", kind: "city", at: [104.07, 49.03], year: "1974" },
      { name: "Калган", modern: "Чжанцзякоу, Хэбэй", kind: "battle", at: [114.88, 40.82], year: "1945" },
    ],
    routes: [
      { label: "Трансмонгол төмөр зам (1949–1956)", kind: "trade", path: [[106.2, 50.23], [105.95, 49.47], [106.92, 47.92], [108.36, 46.36], [110.14, 44.89], [111.9, 43.72], [113.1, 41], [113.3, 40.1], [116.39, 39.91]] },
      { label: "Чөлөөлөх дайн — Калган чиглэл (1945)", kind: "campaign", path: [[113.5, 45.5], [114.2, 43], [114.88, 40.82]] },
      { label: "Чөлөөлөх дайн — Жэхэ чиглэл (1945)", kind: "campaign", path: [[115.5, 45.5], [116.5, 42.8], [117.93, 40.97]] },
    ],
    note:
      "Монгол Улсын өнөөгийн хил энэ үед тогтсон: 1945 оны бүх ард түмний санал асуулгаар тусгаар тогтнолоо баталгаажуулж, 1962 онд БНХАУ-тай хилийн гэрээ байгуулав.",
  },
  democracy: {
    source: "2000",
    snapshot: "Өнөөдөр",
    view: { west: 80, south: 35, east: 128, north: 56 },
    polities: {
      China: { role: "other", label: "БНХАУ", labelAt: [112, 37] },
      Russia: { role: "other", label: "ОХУ", labelAt: [104, 54] },
      Kazakhstan: { role: "other", label: "Казахстан", labelAt: [81, 48.5] },
    },
    modernRealm: { label: "Монгол Улс" },
    places: [
      { name: "Улаанбаатар", modern: "Сүхбаатарын талбай", kind: "capital", at: [106.9176, 47.9185] },
      { name: "Эрдэнэт", modern: "Орхон аймаг — зэс, молибдены үйлдвэр", kind: "city", at: [104.07, 49.03] },
      { name: "Оюу толгой", modern: "Ханбогд сум, Өмнөговь — зэс, алтны орд", kind: "city", at: [106.86, 43.01] },
      { name: "Тавантолгой", modern: "Цогтцэций сум, Өмнөговь — нүүрсний орд", kind: "city", at: [105.53, 43.62] },
      { name: "Замын-Үүд", modern: "Дорноговь — Хятадтай хилийн боомт", kind: "city", at: [111.9, 43.72] },
    ],
    routes: [
      { label: "Трансмонгол төмөр зам", kind: "trade", path: [[106.2, 50.23], [105.95, 49.47], [106.92, 47.92], [108.36, 46.36], [110.14, 44.89], [111.9, 43.72], [113.1, 41], [113.3, 40.1], [116.39, 39.91]] },
    ],
    note: "Монгол Улсын одоогийн хил (geoBoundaries).",
  },
};
