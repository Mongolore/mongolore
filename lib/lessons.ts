import { ERA_DETAILS } from "@/data/eraDetails";
import { ERAS, type Era } from "@/data/eras";
import { ERA_STORIES } from "@/data/eraStories";

/**
 * Duolingo-style lessons generated from the era content in `data/`, so new
 * stories, events and figures show up in lessons without extra writing.
 *
 * Each era is a unit of three lessons:
 *   1. Танилцах — who, when, why
 *   2. Газар ба хүмүүс — hotspots, figures, capitals
 *   3. Он дараалал — ordering and matching events
 *
 * Questions are shuffled with a seeded RNG so a given attempt is stable
 * across renders but each retry is different.
 */

export type Question =
  | {
      kind: "choice";
      prompt: string;
      context?: string;
      options: string[];
      answer: number;
      explain?: string;
      /** Shown only after a right answer (it may say "Correct!"). */
      praise?: string;
    }
  | { kind: "truefalse"; prompt: string; statement: string; answer: boolean; explain?: string }
  | { kind: "order"; prompt: string; items: string[] }
  | { kind: "match"; prompt: string; pairs: [string, string][] };

export type Lesson = {
  id: string;
  eraId: string;
  index: number;
  title: string;
  description: string;
};

export type Unit = { era: Era; lessons: Lesson[] };

const LESSON_KINDS = [
  { title: "Танилцах", description: "Хэн, хэзээ, юуны төлөө" },
  { title: "Газар ба хүмүүс", description: "Түүхэн газар, баатрууд, нийслэл" },
  { title: "Он дараалал", description: "Үйл явдлыг дарааллаар нь" },
];

export const UNITS: Unit[] = ERAS.map((era) => ({
  era,
  lessons: LESSON_KINDS.map((kind, index) => ({
    id: `${era.id}-${index + 1}`,
    eraId: era.id,
    index,
    ...kind,
  })),
}));

export const LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export function findLesson(id: string) {
  return LESSONS.find((l) => l.id === id);
}

/** The lesson before `id` on the path, which must be finished to unlock it. */
export function previousLesson(id: string) {
  const i = LESSONS.findIndex((l) => l.id === id);
  return i > 0 ? LESSONS[i - 1] : undefined;
}

/* ---------------- Seeded randomness ---------------- */

function hash(s: string) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;

function shuffle<T>(items: T[], rand: Rand): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(items: T[], rand: Rand): T {
  return items[Math.floor(rand() * items.length)];
}

/** A multiple-choice question with `correct` shuffled among `wrong`. */
function choice(
  rand: Rand,
  q: { prompt: string; context?: string; correct: string; wrong: string[]; explain?: string },
): Question {
  const wrong = shuffle([...new Set(q.wrong.filter((w) => w !== q.correct))], rand).slice(0, 3);
  const options = shuffle([q.correct, ...wrong], rand);
  return {
    kind: "choice",
    prompt: q.prompt,
    context: q.context,
    options,
    answer: options.indexOf(q.correct),
    explain: q.explain,
  };
}

/** Shortens long event text for tiles, at a word boundary. */
function clip(text: string, max = 90) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function others(era: Era) {
  return ERAS.filter((e) => e.id !== era.id);
}

/* ---------------- Question builders ---------------- */

function introQuestions(era: Era, rand: Rand): Question[] {
  const story = ERA_STORIES[era.id];
  const rest = others(era);
  const other = pick(rest, rand);
  const leadersTrue = rand() < 0.5;

  return [
    choice(rand, {
      prompt: "Энэ аль үеийн тухай вэ?",
      context: era.summary,
      correct: era.name,
      wrong: rest.map((e) => e.name),
    }),
    choice(rand, {
      prompt: `${era.name} — хэзээ?`,
      correct: era.period,
      wrong: rest.map((e) => e.period),
      explain: `${era.name}: ${era.period}`,
    }),
    {
      kind: "truefalse",
      prompt: `${era.name} — үнэн үү, худал уу?`,
      statement: leadersTrue ? story.facts.leaders : ERA_STORIES[other.id].facts.leaders,
      answer: leadersTrue,
      explain: leadersTrue ? undefined : `Энэ нь өөр үе — ${other.name}. ${era.name}: ${story.facts.leaders}`,
    },
    {
      kind: "choice",
      prompt: story.quiz.question,
      options: story.quiz.options,
      answer: story.quiz.answer,
      praise: story.quiz.correct,
    },
    choice(rand, {
      prompt: "Хэр том байсан бэ? Аль үе вэ?",
      context: story.facts.size,
      correct: era.name,
      wrong: rest.map((e) => e.name),
    }),
    choice(rand, {
      prompt: "Гол зорилго, мөргөлдөөн нь юу байв? Аль үе вэ?",
      context: story.facts.goal,
      correct: era.name,
      wrong: rest.map((e) => e.name),
    }),
  ];
}

function peopleQuestions(era: Era, rand: Rand): Question[] {
  const story = ERA_STORIES[era.id];
  const detail = ERA_DETAILS[era.id];
  const rest = others(era);
  const hotspots = shuffle(story.hotspots, rand).slice(0, 2);
  const otherFigures = rest.flatMap((e) => ERA_DETAILS[e.id].figures);
  const thenNowTrue = rand() < 0.5;
  const otherEra = pick(rest, rand);
  const event = pick(detail.events, rand);

  return [
    ...hotspots.map((h) =>
      choice(rand, {
        prompt: "Энэ түүх ямар гарчигтай вэ?",
        context: h.text,
        correct: h.title,
        wrong: story.hotspots.map((x) => x.title),
      }),
    ),
    choice(rand, {
      prompt: `Аль нь ${era.name} үеийн түүхэн хүн бэ?`,
      correct: pick(detail.figures, rand),
      wrong: otherFigures,
      explain: detail.figures.join(" · "),
    }),
    choice(rand, {
      prompt: "Аль үеийн нийслэлийн тухай өгүүлж байна вэ?",
      context: detail.capital,
      correct: era.name,
      wrong: rest.map((e) => e.name),
    }),
    {
      kind: "truefalse",
      prompt: `«Тэр үе ба өнөөдөр»: энэ ${era.name} үетэй холбоотой юу?`,
      statement: thenNowTrue ? pick(story.thenNow, rand) : pick(ERA_STORIES[otherEra.id].thenNow, rand),
      answer: thenNowTrue,
      explain: thenNowTrue ? undefined : `Энэ нь ${otherEra.name} үетэй холбоотой.`,
    },
    choice(rand, {
      prompt: "Энэ үйл явдал хэзээ болсон бэ?",
      context: event.text,
      correct: event.year,
      wrong: detail.events.map((e) => e.year),
    }),
  ];
}

function timelineQuestions(era: Era, rand: Rand): Question[] {
  const detail = ERA_DETAILS[era.id];
  // Events are stored in chronological order; sample while keeping that order.
  const sample = (n: number) =>
    shuffle(
      detail.events.map((e, i) => ({ e, i })),
      rand,
    )
      .slice(0, n)
      .sort((a, b) => a.i - b.i)
      .map((x) => x.e);

  const ordered = sample(4);
  const matched = sample(4);
  const [first, second] = sample(2);
  const flipped = rand() < 0.5;
  const eraIndex = ERAS.indexOf(era);
  const eraSet = shuffle(
    ERAS.map((e, i) => ({ e, i })).filter(({ i }) => i !== eraIndex),
    rand,
  )
    .slice(0, 3)
    .concat({ e: era, i: eraIndex })
    .sort((a, b) => a.i - b.i)
    .map((x) => x.e.name);
  const yearEvent = pick(detail.events, rand);

  return [
    {
      kind: "order",
      prompt: "Үйл явдлуудыг эртнээс нь эхлэн дарааллаар нь байрлуул",
      items: ordered.map((e) => clip(e.text)),
    },
    {
      kind: "match",
      prompt: "Он, үйл явдлыг хос болгон холбо",
      pairs: matched.map((e) => [e.year, clip(e.text, 70)] as [string, string]),
    },
    {
      kind: "truefalse",
      prompt: "Эхлээд нь энэ болсон уу?",
      statement: `1) ${clip((flipped ? second : first).text, 80)}\n2) ${clip((flipped ? first : second).text, 80)}`,
      answer: !flipped,
      explain: `${first.year}: ${clip(first.text, 80)}`,
    },
    choice(rand, {
      prompt: "Энэ үйл явдал хэзээ болсон бэ?",
      context: yearEvent.text,
      correct: yearEvent.year,
      wrong: detail.events.map((e) => e.year),
    }),
    {
      kind: "order",
      prompt: "Эдгээр үеийг эртнээс нь эхлэн эрэмбэл",
      items: eraSet,
    },
  ];
}

const BUILDERS = [introQuestions, peopleQuestions, timelineQuestions];

/** Questions for one attempt at a lesson. A new `attempt` reshuffles everything. */
export function buildQuestions(lessonId: string, attempt = 0): Question[] {
  const lesson = findLesson(lessonId);
  if (!lesson) return [];
  const era = ERAS.find((e) => e.id === lesson.eraId)!;
  const rand = rng(`${lessonId}#${attempt}`);
  return shuffle(BUILDERS[lesson.index](era, rand), rand);
}

/** One multiple-choice question per calendar day, the same for every visitor. */
export function dailyQuestion(day: string): Question {
  const rand = rng(`daily#${day}`);
  const era = pick(ERAS, rand);
  const pool = [...introQuestions(era, rand), ...peopleQuestions(era, rand)].filter((q) => q.kind === "choice");
  return pick(pool, rand);
}
