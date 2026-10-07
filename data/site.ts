/** Page copy and navigation for the landing page. */
export const SITE_NAME = "ТҮҮХ MAP";
export const SITE_YEAR = 2026;

export const NAV_LINKS = [
  { href: "#map", label: "Газрын зураг" },
  { href: "#team", label: "Бид хэн бэ?" },
  { href: "#what-we-do", label: "Бид юу хийдэг вэ?" },
  { href: "#features", label: "Боломжууд" },
] as const;

export const HERO = {
  subtitle:
    "Одоо үеийн залууст зориулсан Монголын интерактив түүхэн газрын зургийн веб платформ",
  primaryCta: { label: "Газрын зураг үзэх", href: "#map" },
  secondaryCta: { label: "Бидний тухай", href: "#team" },
  learnCta: "Тоглож суралцах",
  /** Decorative word in traditional Mongolian script ("Монгол"). */
  scriptWord: "ᠮᠣᠩᠭᠣᠯ",
};

export const MAP_PANEL = {
  title: "Монгол Улс",
  meta: "21 аймаг · нийслэл Улаанбаатар",
  /** Geographic centre of Mongolia, shown as a cartographic detail. */
  coordinates: "46°52′ х.ө. · 103°51′ з.у.",
  hint: "Аймаг дээр дарж эсвэл Tab товчоор сонгоно уу",
  legend: {
    era: "Тухайн үеийн голомт",
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

export const TEAM_SECTION = {
  title: "Бид хэн бэ?",
  intro:
    "Бид Монголын өсвөр насныханд түүхийг сонирхолтой, ойлгомжтой болгохыг зорьсон 5 гишүүнтэй баг.",
  rosterLabel: "Багийн гишүүд",
};

export const WHAT_WE_DO = {
  title: "Бид юу хийдэг вэ?",
  intro:
    "Бид Монголын түүхэн үйл явдал, дурсгалт газар, түүхэн хүмүүсийг газрын зураг дээр байршуулж, цаг хугацааны шугам болон монгол аудио тайлбараар дамжуулан түүхийг хялбар, сонирхолтой болгодог.",
  problemLabel: "Өнөөдөр",
  solutionLabel: "ТҮҮХ MAP дээр",
  items: [
    {
      problem: "Уйтгартай сурах арга",
      solution: "Газрын зураг, зураг, аудиогоор сурна",
    },
    {
      problem: "Ном сурах бичиг хүрэлцдэггүй",
      solution: "Хэзээ ч, хаанаас ч нээгдэх цахим архив",
    },
    {
      problem: "Тархай бутархай мэдээлэл",
      solution: "Эх сурвалжтай, нэг дор цэгцэлсэн мэдээлэл",
    },
  ],
};

export const FEATURES_SECTION = {
  title: "Боломжууд",
  availableLabel: "Ашиглах боломжтой",
  soonLabel: "Удахгүй",
};

export const FOOTER = {
  teamLabel: "Баг",
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
  centreLabel: "Төв",
  boundsLabel: "Хүрээ",
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
  geojsonLabel: "GeoJSON татах",
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
