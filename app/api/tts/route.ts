import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

/**
 * POST { text, lang: "mn" | "en" } → audio/mpeg
 *
 * Neural text-to-speech for narration (lib/narration.tsx), using Microsoft's
 * free Read Aloud voices — the only free source of a real Mongolian voice.
 * Browsers almost never ship one, so without this Mongolian would be read by
 * a Russian voice.
 */

const VOICES = {
  mn: "mn-MN-YesuiNeural",
  en: "en-US-AvaNeural",
} as const;

const MAX_CHARS = 1200;
const CACHE_LIMIT = 200;
const cache = new Map<string, Buffer>();

function synthesize(text: string, voice: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tts = new MsEdgeTTS();
    const timer = setTimeout(() => {
      tts.close();
      reject(new Error("tts timeout"));
    }, 20000);

    tts
      .setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
      .then(() => {
        const { audioStream } = tts.toStream(text);
        const chunks: Buffer[] = [];
        audioStream.on("data", (c: Buffer) => chunks.push(c));
        audioStream.on("close", () => {
          clearTimeout(timer);
          tts.close();
          const audio = Buffer.concat(chunks);
          if (audio.length === 0) reject(new Error("empty audio"));
          else resolve(audio);
        });
        audioStream.on("error", (e: Error) => {
          clearTimeout(timer);
          tts.close();
          reject(e);
        });
      })
      .catch((e: unknown) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

export async function POST(request: Request) {
  let text: unknown;
  let lang: unknown;
  try {
    ({ text, lang } = (await request.json()) as { text?: unknown; lang?: unknown });
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim() || text.length > MAX_CHARS || (lang !== "mn" && lang !== "en")) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const key = `${lang}:${text}`;
  let audio = cache.get(key);
  if (!audio) {
    try {
      audio = await synthesize(text, VOICES[lang]);
    } catch (error) {
      console.error("[tts]", error);
      return Response.json({ error: "failed" }, { status: 502 });
    }
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
    cache.set(key, audio);
  }

  return new Response(new Uint8Array(audio), {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" },
  });
}
