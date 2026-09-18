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
