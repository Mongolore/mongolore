/** Page copy and navigation for the landing page. */
export const SITE_NAME = "MongoLore";
/** The brand split for styling: "Mongo" in ink, "Lore" in gold. */
export const SITE_NAME_PARTS = ["Mongo", "Lore"] as const;
export const SITE_YEAR = 2026;

export const NAV_LINKS = [
  { href: "/map", label: "Түүхэн газрын зураг" },
  { href: "#map", label: "Аймгууд" },
  { href: "#eras", label: "Эрин үеүд" },
  { href: "#team", label: "Бид хэн бэ?" },
] as const;

export const HERO = {
  tagline: "Цагийг чир. Эзэнт гүрэн мандаж, хил хязгаар өөрчлөгдөхийг хар.",
  subtitle:
    "Одоо үеийн залууст зориулсан Монголын интерактив түүхэн газрын зургийн веб платформ",
  primaryCta: { label: "Түүхэн газрын зураг нээх", href: "/map" },
  learnCta: "Тоглож суралцах",
  /** Decorative word in traditional Mongolian script ("Монгол"). */
  scriptWord: "ᠮᠣᠩᠭᠣᠯ",
};

/** Copy for the 3D globe in the hero. */
export const GLOBE = {
  aria: "Монголын түүхэн хил хязгаарыг харуулсан 3D бөмбөрцөг",
  dragHint: "Бөмбөрцгийг чирж эргүүл",
  areaLabel: "Нутаг дэвсгэр",
  areaUnit: "сая км²",
  ratioPrefix: "Өнөөгийн Монголоос",
  todayLegend: "Өнөөгийн Монгол",
  play: "2200 жилийг тоглуулах",
  pause: "Зогсоох",
};

export const HERO_STATS = [
  { value: 2200, suffix: "+", label: "жилийн түүх" },
  { value: 9, suffix: "", label: "эрин үе" },
  { value: 21, suffix: "", label: "аймаг" },
] as const;

export const AIMAG_SECTION = {
  eyebrow: "Аймгаар аялах",
  title: "Нутаг бүр өөрийн түүхтэй",
  intro:
    "Цаг хугацааны шугамыг чирэхэд тухайн үеийн улсын хил өнөөгийн аймгуудын доор зурагдана. Аймаг дээр дарж тэр үед юу болж байсныг уншаарай.",
};

export const MAP_PANEL = {
  title: "Монгол Улс",
  meta: "21 аймаг · нийслэл Улаанбаатар",
  hint: "Аймаг дээр дарж эсвэл Tab товчоор сонгоно уу",
  legend: {
    era: "Тухайн үеийн голомт",
    realm: "Тухайн үеийн Монгол төр",
    site: "Түүхэн газар",
    selected: "Сонгосон аймаг",
  },
  scaleLabel: "400 км",
  northLabel: "Х",
};

export const TIMELINE = {
  label: "Цаг хугацааны шугам",
  /** Screen-reader description for the draggable handle. */
  handleLabel: "Түүхэн үеийг сонгох",
  hint: "Сумыг чирж үеэ солино уу",
  previous: "Өмнөх үе",
  next: "Дараагийн үе",
};

export const ERA_STRIP = {
  title: "2200 жилийн аялал",
  intro: "Эрин үеээ сонгоод газрын зураг дээр тухайн үеийн хил, нийслэл, аян дайныг үз — өнөөгийн Монголтой харьцуулаарай.",
  cta: "Газрын зураг дээр үзэх",
};

export const TEAM_SECTION = {
  title: "Бид хэн бэ?",
  intro:
    "Бид Монголын өсвөр насныханд түүхийг сонирхолтой, ойлгомжтой болгохыг зорьсон 5 гишүүнтэй баг.",
  rosterLabel: "Багийн гишүүд",
};

export const FOOTER = {
  navLabel: "Хэсгүүд",
  backToTop: "Дээш буцах",
};

/** Copy for the full-screen historical map at /map. */
export const FULL_MAP = {
  title: "Түүхэн газрын зураг",
  description:
    "Монголын түүхэн үе бүрийн хил, нийслэл, аян дайн, худалдааны замыг тухайн цаг үеийн байдлаар нь харуулсан бүтэн газрын зураг.",
  home: "Нүүр хуудас",
  toDetails: "Дэлгэрэнгүй",
  /** Shown on the landing-page map, linking here. */
  openFull: "Бүтэн газрын зургаар үзэх",
  loading: "Газрын зураг ачаалж байна…",
  failed: "Газрын зургийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу.",
  snapshotLabel: "Хилийн зураглал",
  legendTitle: "Тэмдэглэгээ",
  legendHint: "Замын төрлийг дарж нуух, харуулна уу",
  roles: {
    realm: "Монгол төр",
    ally: "Вассал, харьяат",
    ruler: "Захирч буй гүрэн",
    other: "Хөрш улс",
  },
  places: {
    capital: "Нийслэл",
    ordo: "Орд, өргөө",
    city: "Хот, зах",
    fortress: "Цайз, харуул",
    battle: "Тулалдаан",
    monument: "Дурсгал, хийд",
  },
  routes: {
    trade: "Худалдааны зам",
    yam: "Өртөөний зам",
    campaign: "Цэргийн аян",
    migration: "Нүүдэл",
    journey: "Элч, мөргөлийн аялал",
  },
  sections: {
    governance: "Засаглал, улс төрийн байдал",
    territory: "Нутаг дэвсгэр ба байгалийн хил",
    capital: "Нийслэл ба орд",
    military: "Цэргийн ажиллагаа, аян дайн",
    trade: "Худалдаа, эдийн засаг, соёл",
    figures: "Түүхэн хүмүүс",
    events: "Он дараалал",
    neighbours: "Хөрш улсууд",
    map: "Газрын зургийн тухай",
  },
  frontiers: { north: "Хойд", south: "Өмнөд", east: "Зүүн", west: "Баруун" },
  routesLabel: "Замууд",
  placesLabel: "Газрууд",
  sourceLabel: "Хилийн эх сурвалж",
  hydroLabel: "Гол мөрөн",
  precisionNote:
    "Эртний үеийн хил ойролцоо: нүүдэлчдийн хил тогтмол шугам биш, бэлчээр, харьяат аймгуудын хамаарлаар өөрчлөгдөж байв.",
};

/** Copy for the story layer of /map: hook, fast facts, hotspots and quiz. */
export const STORY = {
  nutshell: "Товчхондоо",
  facts: {
    leaders: "Хэн удирдаж байсан бэ?",
    size: "Хэр том байсан бэ?",
    goal: "Гол зорилго, мөргөлдөөн",
  },
  hotspotsTitle: "Газрын зураг дээрх цэгүүд",
  hotspotsIntro: "Газрын зураг дээрх дугаартай цэгүүдийг дарж, тухайн газрын түүхийг уншаарай.",
  hotspotKinds: {
    capital: "Нийслэл, төв",
    turning: "Эргэлтийн цэг",
    route: "Зам, хөдөлгөөн",
    secret: "Сонирхолтой баримт",
  },
  showOnMap: "Газрын зураг дээр харах",
  close: "Хаах",
  previous: "Өмнөх цэг",
  next: "Дараагийн цэг",
  of: "/",
  thenNow: "Тэр үе ба өнөөдөр",
  quizTitle: "Шалгаад үзье",
  quizWrong: "Бараг л! Зөв хариулт нь:",
  quizRetry: "Дахин оролдох",
  deepDive: "Гүнзгийрүүлж судлах",
};

/** The immersive scene that opens from a story hotspot on /map. */
export const SCENE = {
  enter: "Тэр мөчид очих",
  enterHint: "Амилсан дүр зураг",
  badge: "Уран сайхны дүрслэл",
  soundOn: "Дуу асаах",
  soundOff: "Дуу хаах",
  previous: "Өмнөх",
  next: "Дараах",
  replay: "Дахин үзэх",
  nextScene: "Дараагийн дүр зураг",
  backToMap: "Газрын зураг руу буцах",
  endTitle: "Чи тэнд байлаа.",
  hint: "Хулганаа хөдөлгөж эргэн тойрноо хар · дарж үргэлжлүүл",
};

/** "Then vs today" comparison on /map. */
export const COMPARE = {
  on: "Өнөөдөртэй харьцуулах",
  off: "Харьцуулалтыг хаах",
  today: "Өнөөдөр",
  todayName: "Өнөөгийн Монгол",
  bigger: "өнөөгийн Монголоос том",
  smaller: "өнөөгийн Монголоос жижиг",
  handle: "Тэр үе ба өнөөдрийг харьцуулах шугам",
};
