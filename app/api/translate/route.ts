import Anthropic from "@anthropic-ai/sdk";

/**
 * POST { texts: string[] } → { translations: string[] }
 *
 * Translates Mongolian text to English for the page translator
 * (lib/translator.ts). Works with no setup through Google Translate's free
 * web endpoint. If ANTHROPIC_API_KEY is set, Claude is used instead — it
 * knows the established English names for historical people and places
 * (Модун → Modu Chanyu, Хархорум → Karakorum) and keeps the tone.
 */

const MAX_TEXTS = 60;
const MAX_TEXT_CHARS = 2000;
const MAX_TOTAL_CHARS = 20000;
const CYRILLIC = /[Ѐ-ӿ]/;

const cache = new Map<string, string>();

export async function POST(request: Request) {
  let texts: unknown;
  try {
    ({ texts } = (await request.json()) as { texts?: unknown });
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    texts.length > MAX_TEXTS ||
    !texts.every((t) => typeof t === "string" && t.length <= MAX_TEXT_CHARS && CYRILLIC.test(t)) ||
    texts.reduce((n: number, t: string) => n + t.length, 0) > MAX_TOTAL_CHARS
  ) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const strings = texts as string[];
  const missing = [...new Set(strings.filter((t) => !cache.has(t)))];

  if (missing.length > 0) {
    try {
      const translated = process.env.ANTHROPIC_API_KEY ? await withClaude(missing) : await withGoogle(missing);
      // An empty result means "couldn't translate": show the original, and don't cache it.
      missing.forEach((text, i) => {
        if (translated[i].trim()) cache.set(text, translated[i]);
      });
    } catch (error) {
      console.error("[translate]", error);
      return Response.json({ error: "failed" }, { status: 502 });
    }
  }

  return Response.json({ translations: strings.map((t) => cache.get(t) ?? t) });
}

/* ---------------- Google Translate (free, no key) ---------------- */

async function withGoogle(texts: string[]): Promise<string[]> {
  const out = await googleBatch(texts);
  // Google occasionally returns "" for a short string inside a large batch; ask again on its own.
  const empty = out.flatMap((t, i) => (t.trim() ? [] : [i]));
  if (empty.length > 0 && texts.length > 1) {
    const retried = await Promise.all(empty.map((i) => googleBatch([texts[i]]).then(([t]) => t).catch(() => "")));
    empty.forEach((i, k) => (out[i] = retried[k]));
  }
  return out;
}

async function googleBatch(texts: string[]): Promise<string[]> {
  const body = new URLSearchParams();
  for (const t of texts) body.append("q", t);
  const res = await fetch("https://translate.googleapis.com/translate_a/t?client=gtx&sl=mn&tl=en", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`google translate ${res.status}`);
  const out = (await res.json()) as unknown;
  if (!Array.isArray(out) || out.length !== texts.length || !out.every((t) => typeof t === "string")) {
    throw new Error("malformed google translation");
  }
  // Google trims; keep each string's own surrounding whitespace.
  return (out as string[]).map((t, i) => {
    const [, lead, , trail] = texts[i].match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    return lead + t.trim() + trail;
  });
}

/* ---------------- Claude (optional, better names and tone) ---------------- */

const SYSTEM = `You translate text from ТҮҮХ MAP, a website teaching Mongolian history to teenagers, from Mongolian (Cyrillic) into natural, friendly English.

Rules:
- You receive a JSON array of strings, which are UI labels, headings, or history passages. Return exactly one translation per string, in the same order.
- Use the established English names for historical people, places, states, and titles where they exist (Хүннү → Xiongnu, Хархорум → Karakorum, Чингис хаан → Genghis Khan, шаньюй → chanyu, Эрдэнэ зуу → Erdene Zuu). Otherwise, romanize.
- Keep numbers, dates, punctuation, symbols, and emoji. Translate era abbreviations: МЭӨ → BC, МЭ → AD.
- Keep the tone and length of the original. Short labels stay short; button text stays imperative.
- If a string is a fragment, translate it as a fragment and don't complete it.
- Return any text that is already English unchanged.`;

let client: Anthropic | null = null;

async function withClaude(texts: string[]): Promise<string[]> {
  client ??= new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { translations: { type: "array", items: { type: "string" } } },
            required: ["translations"],
            additionalProperties: false,
          },
        },
      },
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(texts) }],
    });

    if (response.stop_reason === "refusal") throw new Error("refused");
    const text = response.content.find((b) => b.type === "text");
    const { translations } = JSON.parse(text?.type === "text" ? text.text : "{}") as { translations?: unknown };
    if (
      !Array.isArray(translations) ||
      translations.length !== texts.length ||
      !translations.every((t) => typeof t === "string")
    ) {
      throw new Error("malformed translation");
    }
    return translations as string[];
  } catch (error) {
    // A bad key or an outage shouldn't break the button: fall back to Google.
    console.error("[translate] Claude failed, using Google:", error);
    return withGoogle(texts);
  }
}
