import { ERA_DETAILS, type EraEvent } from "@/data/eraDetails";
import { ERAS, type Era } from "@/data/eras";
import { ERA_STORIES } from "@/data/eraStories";
import { ERA_MAPS, type LonLat, type Place, type PlaceKind } from "@/data/historyMaps";
import { sceneFor, type SceneId } from "@/data/scenes";

/**
 * Lessons generated from the era content in `data/`, so new stories, events,
 * places and figures show up in lessons without extra writing.
 *
 * Each era is a unit of three lessons, and every lesson has two halves:
 *   - study cards (`buildStudy`): the facts, with a scene, a map or a timeline;
 *   - questions (`buildQuestions`): about exactly what the cards showed.
 *
 *   1. Танилцах — who, when, why
 *   2. Газар ба хүмүүс — where things were, on the map
 *   3. Он дараалал — what happened when
 *
 * Every question carries `explain`, the fact behind it, shown after it is
 * answered and kept in the learner's mistake notebook (lib/mistakes.ts).
 * Questions are shuffled with a seeded RNG so a given attempt is stable
 * across renders but each retry is different.
 */

export type Pin = { name: string; at: LonLat };

type QuestionBody =
  | {
      kind: "choice";
      prompt: string;
      context?: string;
      options: string[];
      answer: number;
      /** Shown only after a right answer (it may say "Correct!"). */
      praise?: string;
    }
  | { kind: "truefalse"; prompt: string; statement: string; answer: boolean }
  | { kind: "order"; prompt: string; items: string[] }
  | { kind: "match"; prompt: string; pairs: [string, string][] }
  /** Tap the pin where `target` is. Pin names stay hidden until checked. */
  | { kind: "locate"; prompt: string; target: string; pins: Pin[]; answer: number };

export type Question = QuestionBody & {
  /** Stable for the same question content, so a repeat miss updates one notebook entry. */
  id: string;
  eraId: string;
  /** The fact behind the question, shown once it is answered. */
  explain?: string;
};

type Draft = QuestionBody & { explain?: string };

export type StudyVisual =
  | { type: "scene"; scene: SceneId }
  | { type: "map"; pins: Pin[] }
  | { type: "timeline"; events: EraEvent[] }
  | { type: "people"; names: string[] };

/** One thing to learn before the questions start. */
export type StudyCard = {
  kicker: string;
  title: string;
  body: string[];
  /** Render `body` as a list rather than paragraphs. */
  bullets?: boolean;
  visual?: StudyVisual;
};

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

/* ---------------- Helpers ---------------- */

/** A multiple-choice question with `correct` shuffled among `wrong`. */
function choice(
  rand: Rand,
  q: { prompt: string; context?: string; correct: string; wrong: string[]; explain?: string },
): Draft {
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

const PLACE_LABEL: Record<PlaceKind, string> = {
  capital: "Нийслэл",
  ordo: "Орд, өргөө",
  city: "Хот, худалдааны төв",
  fortress: "Цайз",
  battle: "Тулалдааны газар",
  monument: "Дурсгал, хийд",
};

/** Where a place is today, without the trailing note ("… — Хань улсын нийслэл"). */
const modernOf = (p: Place) => p.modern.split(" — ")[0];
const pinOf = (p: Place): Pin => ({ name: p.name, at: p.at });
const placeFact = (p: Place) => `${p.name} — ${p.modern}${p.year ? ` (${p.year})` : ""}`;

/** The era's seat of power, if the map marks one. */
function seatOf(eraId: string) {
  const places = ERA_MAPS[eraId]?.places ?? [];
  return places.find((p) => p.kind === "capital") ?? places.find((p) => p.kind === "ordo");
}

/** The hotspots a lesson teaches — the same ones its questions ask about. */
function studiedHotspots(eraId: string) {
  return ERA_STORIES[eraId].hotspots.slice(0, 3);
}

/**
 * A "find it on the map" question: the target plus up to three other places
 * of the era, far enough apart that their pins never overlap.
 */
function locate(era: Era, target: Place, rand: Rand): Draft | null {
  const config = ERA_MAPS[era.id];
  const gap = Math.max(1.6, (config.view.east - config.view.west) * 0.05);
  const apart = (a: Place, b: Place) =>
    Math.hypot((a.at[0] - b.at[0]) * Math.cos((a.at[1] * Math.PI) / 180), a.at[1] - b.at[1]) >= gap;
  const chosen = [target];
  for (const place of shuffle(config.places, rand)) {
    if (chosen.length === 4) break;
    if (place.name !== target.name && chosen.every((c) => apart(c, place))) chosen.push(place);
  }
  if (chosen.length < 3) return null;
  const pins = shuffle(chosen, rand);
  return {
    kind: "locate",
    prompt: `«${target.name}» газрын зураг дээр хаана байна вэ?`,
    target: target.name,
    pins: pins.map(pinOf),
    answer: pins.indexOf(target),
    explain: placeFact(target),
  };
}

/* ---------------- Question builders ---------------- */

function introQuestions(era: Era, rand: Rand): Draft[] {
  const story = ERA_STORIES[era.id];
  const detail = ERA_DETAILS[era.id];
  const rest = others(era);
  const other = pick(rest, rand);
  const leadersTrue = rand() < 0.5;
  const seat = seatOf(era.id);
  const otherSeats = rest.flatMap((e) => seatOf(e.id)?.name ?? []);
  const ownPlaces = new Set(ERA_MAPS[era.id].places.map((p) => p.name));

  return [
    choice(rand, {
      prompt: `${era.name} хэзээ оршин тогтнож байв?`,
      correct: era.period,
      wrong: rest.map((e) => e.period),
      explain: `${era.name}: ${era.period}. ${era.summary}`,
    }),
    {
      kind: "choice",
      prompt: story.quiz.question,
      options: story.quiz.options,
      answer: story.quiz.answer,
      praise: story.quiz.correct,
      explain: story.quiz.correct,
    },
    {
      kind: "truefalse",
      prompt: `${era.name} — үнэн үү, худал уу?`,
      statement: leadersTrue ? story.facts.leaders : ERA_STORIES[other.id].facts.leaders,
      answer: leadersTrue,
      explain: leadersTrue
        ? story.facts.leaders
        : `Энэ нь өөр үе — ${other.name}. ${era.name}: ${story.facts.leaders}`,
    },
    choice(rand, {
      prompt: `Аль нь ${era.name} үеийн түүхэн хүн бэ?`,
      correct: pick(detail.figures, rand),
      wrong: rest.flatMap((e) => ERA_DETAILS[e.id].figures),
      explain: `${era.name}: ${detail.figures.join(" · ")}`,
    }),
    seat
      ? choice(rand, {
          prompt: `${era.name}: нийслэл, төв нь аль вэ?`,
          correct: seat.name,
          wrong: otherSeats.filter((name) => !ownPlaces.has(name)),
          explain: `${placeFact(seat)}. ${detail.capital}`,
        })
      : choice(rand, {
          prompt: "Энэ аль үеийн тухай вэ?",
          context: era.summary,
          correct: era.name,
          wrong: rest.map((e) => e.name),
          explain: `${era.name} (${era.period}): ${era.summary}`,
        }),
    choice(rand, {
      prompt: "Энэ аль үеийн гол зорилго, мөргөлдөөн бэ?",
      context: story.facts.goal,
      correct: era.name,
      wrong: rest.map((e) => e.name),
      explain: `${era.name}: ${story.facts.goal}`,
    }),
  ];
}

function peopleQuestions(era: Era, rand: Rand): Draft[] {
  const story = ERA_STORIES[era.id];
  const places = ERA_MAPS[era.id].places;
  const rest = others(era);
  const [first, second, third] = shuffle(places, rand);
  const hotspot = pick(studiedHotspots(era.id), rand);
  const thenNowTrue = rand() < 0.5;
  const otherEra = pick(rest, rand);
  const allModern = [...places, ...rest.flatMap((e) => ERA_MAPS[e.id].places)].map(modernOf);

  const questions: (Draft | null)[] = [
    locate(era, first, rand),
    second ? locate(era, second, rand) : null,
    third
      ? choice(rand, {
          prompt: `«${third.name}» өнөөдөр хаана байдаг вэ?`,
          correct: modernOf(third),
          wrong: allModern,
          explain: placeFact(third),
        })
      : null,
    choice(rand, {
      prompt: `«${first.name}» бол юу вэ?`,
      correct: PLACE_LABEL[first.kind],
      wrong: Object.values(PLACE_LABEL),
      explain: `${PLACE_LABEL[first.kind]}: ${placeFact(first)}`,
    }),
    choice(rand, {
      prompt: "Энэ түүх аль газар, үйл явдлын тухай вэ?",
      context: hotspot.text,
      correct: hotspot.title,
      wrong: story.hotspots.map((x) => x.title),
      explain: hotspot.title,
    }),
    {
      kind: "truefalse",
      prompt: `«Тэр үе ба өнөөдөр»: энэ ${era.name} үетэй холбоотой юу?`,
      statement: thenNowTrue ? pick(story.thenNow, rand) : pick(ERA_STORIES[otherEra.id].thenNow, rand),
      answer: thenNowTrue,
      explain: thenNowTrue ? `Тийм — энэ бол ${era.name} үеийн өв.` : `Үгүй — энэ нь ${otherEra.name} үетэй холбоотой.`,
    },
  ];
  return questions.filter((q): q is Draft => q !== null);
}

function timelineQuestions(era: Era, rand: Rand): Draft[] {
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
  const fact = (e: EraEvent) => `${e.year}: ${e.text}`;

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
    .map((x) => x.e);
  const yearEvent = pick(detail.events, rand);
  const whatEvent = pick(detail.events, rand);

  return [
    {
      kind: "order",
      prompt: "Үйл явдлуудыг эртнээс нь эхлэн дарааллаар нь байрлуул",
      items: ordered.map((e) => clip(e.text)),
      explain: ordered.map((e) => `${e.year} — ${clip(e.text, 60)}`).join("\n"),
    },
    {
      kind: "match",
      prompt: "Он, үйл явдлыг хос болгон холбо",
      pairs: matched.map((e) => [e.year, clip(e.text, 70)] as [string, string]),
      explain: matched.map((e) => `${e.year} — ${clip(e.text, 60)}`).join("\n"),
    },
    choice(rand, {
      prompt: `${whatEvent.year} онд юу болсон бэ?`,
      correct: clip(whatEvent.text),
      wrong: detail.events.map((e) => clip(e.text)),
      explain: fact(whatEvent),
    }),
    choice(rand, {
      prompt: "Энэ үйл явдал хэзээ болсон бэ?",
      context: yearEvent.text,
      correct: yearEvent.year,
      wrong: detail.events.map((e) => e.year),
      explain: fact(yearEvent),
    }),
    {
      kind: "truefalse",
      prompt: "Эхлээд нь энэ болсон уу?",
      statement: `1) ${clip((flipped ? second : first).text, 80)}\n2) ${clip((flipped ? first : second).text, 80)}`,
      answer: !flipped,
      explain: `${first.year} — ${clip(first.text, 70)}\n${second.year} — ${clip(second.text, 70)}`,
    },
    {
      kind: "order",
      prompt: "Эдгээр үеийг эртнээс нь эхлэн эрэмбэл",
      items: eraSet.map((e) => e.name),
      explain: eraSet.map((e) => `${e.period} — ${e.name}`).join("\n"),
    },
  ];
}

const BUILDERS = [introQuestions, peopleQuestions, timelineQuestions];

/** A stable id from what the question asks, not from where its options landed. */
function questionId(q: Draft) {
  const core =
    q.kind === "choice"
      ? `${q.context ?? ""}|${q.options[q.answer]}`
      : q.kind === "truefalse"
        ? q.statement
        : q.kind === "order"
          ? q.items.join("|")
          : q.kind === "match"
            ? q.pairs.map((p) => p[0]).join("|")
            : q.target;
  return hash(`${q.kind}|${q.prompt}|${core}`).toString(36);
}

const finish = (era: Era, drafts: Draft[]): Question[] =>
  drafts.map((q) => ({ ...q, id: questionId(q), eraId: era.id }));

/** Questions for one attempt at a lesson. A new `attempt` reshuffles everything. */
export function buildQuestions(lessonId: string, attempt = 0): Question[] {
  const lesson = findLesson(lessonId);
  if (!lesson) return [];
  const era = ERAS.find((e) => e.id === lesson.eraId)!;
  const rand = rng(`${lessonId}#${attempt}`);
  return shuffle(finish(era, BUILDERS[lesson.index](era, rand)), rand);
}

/** One multiple-choice question per calendar day, the same for every visitor. */
export function dailyQuestion(day: string): Question {
  const rand = rng(`daily#${day}`);
  const era = pick(ERAS, rand);
  const pool = finish(era, [...introQuestions(era, rand), ...timelineQuestions(era, rand)]).filter(
    (q) => q.kind === "choice",
  );
  return pick(pool, rand);
}

/**
 * The same question with its options (or pins) in a new order, so revising a
 * mistake tests the fact rather than the remembered position.
 */
export function reshuffled(q: Question, seed: string): Question {
  const rand = rng(`${q.id}#${seed}`);
  if (q.kind === "choice") {
    const options = shuffle(q.options, rand);
    return { ...q, options, answer: options.indexOf(q.options[q.answer]) };
  }
  if (q.kind === "locate") {
    const pins = shuffle(q.pins, rand);
    return { ...q, pins, answer: pins.indexOf(q.pins[q.answer]) };
  }
  return q;
}

/* ---------------- Study cards ---------------- */

const HOTSPOT_KICKER = { capital: "Нийслэл, төв", turning: "Эргэлтийн цэг", route: "Зам, хөдөлгөөн", secret: "Сонирхолтой баримт" };

/** What a lesson teaches before it asks: 2–5 cards, each one idea. */
export function buildStudy(lessonId: string): StudyCard[] {
  const lesson = findLesson(lessonId);
  if (!lesson) return [];
  const era = ERAS.find((e) => e.id === lesson.eraId)!;
  const story = ERA_STORIES[era.id];
  const detail = ERA_DETAILS[era.id];
  const places = ERA_MAPS[era.id].places;
  const scene = (i: number): StudyVisual => ({ type: "scene", scene: sceneFor(era.id, i, story.hotspots[i].kind) });
  const turning = Math.max(0, story.hotspots.findIndex((h) => h.kind === "turning"));

  if (lesson.index === 0) {
    return [
      { kicker: `${era.period} · ${era.name}`, title: story.hook.title, body: [story.hook.summary], visual: scene(0) },
      {
        kicker: "Хэн удирдаж байсан бэ?",
        title: "Удирдагчид",
        body: [story.facts.leaders],
        visual: { type: "people", names: detail.figures },
      },
      {
        kicker: "Хэр том байсан бэ?",
        title: "Нутаг дэвсгэр",
        body: [story.facts.size, detail.capital],
        visual: { type: "map", pins: places.map(pinOf) },
      },
      { kicker: "Гол зорилго, мөргөлдөөн", title: "Юуны төлөө тэмцэв?", body: [story.facts.goal], visual: scene(turning) },
    ];
  }
  if (lesson.index === 1) {
    return [
      {
        kicker: "Газрын зураг",
        title: "Энэ үеийн гол газрууд",
        body: places.map(placeFact),
        bullets: true,
        visual: { type: "map", pins: places.map(pinOf) },
      },
      ...studiedHotspots(era.id).map((h, i) => ({
        kicker: HOTSPOT_KICKER[h.kind],
        title: h.title,
        body: [h.text],
        visual: scene(i),
      })),
    ];
  }
  return [
    {
      kicker: `${era.period} · Он дараалал`,
      title: "Юу, хэзээ болсон бэ?",
      body: [],
      visual: { type: "timeline", events: detail.events },
    },
    { kicker: "Тэр үе ба өнөөдөр", title: "Өнөөдөртэй холбогдох нь", body: story.thenNow, bullets: true },
  ];
}
