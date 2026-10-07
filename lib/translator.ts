/**
 * Page-level Mongolian → English translator.
 *
 * Walks the DOM, swaps each Cyrillic text node (and a few visible attributes)
 * for its English translation in place, and keeps watching for new text React
 * renders. Text nodes are edited, never replaced, so React keeps owning them:
 * when React writes new Mongolian text the observer picks it up and translates
 * it too. Turning the translator off restores every original string.
 *
 * Translations come from `/api/translate` and are cached in memory and in
 * localStorage, so revisiting a page is instant and costs nothing.
 *
 * Text whose element has a `data-en` attribute is never sent for
 * translation; the attribute's value is shown instead. Use it for names,
 * which must be spelled in Latin letters rather than translated.
 */

const CYRILLIC = /[Ѐ-ӿ]/;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;
// v2: v1 could hold empty strings from a Google batch glitch.
const STORAGE_KEY = "mongolore:tx:en:v2";
const BATCH_STRINGS = 40;
const BATCH_CHARS = 6000;
const CONCURRENCY = 3;

export type TranslatorStatus = "idle" | "translating" | "error";
export type TranslatorError = "missing_key" | "failed";

type Listener = (status: TranslatorStatus, error?: TranslatorError) => void;

/** Splits "  text  " into its whitespace and core so the spacing survives translation. */
function splitSpace(value: string): [string, string, string] {
  const m = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return m ? [m[1], m[2], m[3]] : ["", value, ""];
}

function skipped(el: Element | null): boolean {
  for (let node = el; node; node = node.parentElement) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if (node.hasAttribute("data-no-translate") || node.getAttribute("translate") === "no") return true;
  }
  return false;
}

function loadCache(): Map<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Map(Object.entries(JSON.parse(raw) as Record<string, string>));
  } catch {
    // Storage blocked or corrupt — start empty.
  }
  return new Map();
}

export class PageTranslator {
  private cache = loadCache();
  /** Text node → its Mongolian source. */
  private texts = new Map<Text, string>();
  /** Element → attribute name → Mongolian source. */
  private attrs = new Map<Element, Map<string, string>>();
  /** What we last wrote into a node, so our own edits aren't mistaken for React's. */
  private applied = new WeakMap<Text, string>();
  private appliedAttrs = new WeakMap<Element, Map<string, string>>();
  private title: string | null = null;

  private queued = new Set<string>();
  private inFlight = new Set<string>();
  private failed = new Set<string>();
  private running = 0;
  private observer: MutationObserver | null = null;
  private scanTimer: number | null = null;
  private saveTimer: number | null = null;
  private listeners = new Set<Listener>();
  private idleWaiters: (() => void)[] = [];
  private active = false;

  constructor(private endpoint = "/api/translate") {}

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  /** Resolves once every string currently on screen has a translation (or failed). */
  whenIdle(): Promise<void> {
    if (!this.active || (this.running === 0 && this.queued.size === 0 && this.scanTimer === null)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.idleWaiters.push(resolve));
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.failed.clear();
    this.observer = new MutationObserver(() => this.scheduleScan());
    this.observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
    this.scan();
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.observer?.disconnect();
    this.observer = null;
    if (this.scanTimer !== null) window.clearTimeout(this.scanTimer);
    this.scanTimer = null;
    this.queued.clear();

    for (const [node, source] of this.texts) {
      if (node.isConnected && this.applied.get(node) === node.nodeValue) node.nodeValue = source;
    }
    for (const [el, sources] of this.attrs) {
      const mine = this.appliedAttrs.get(el);
      for (const [name, source] of sources) {
        if (el.isConnected && mine?.get(name) === el.getAttribute(name)) el.setAttribute(name, source);
      }
    }
    if (this.title !== null) document.title = this.title;
    this.texts.clear();
    this.attrs.clear();
    this.applied = new WeakMap();
    this.appliedAttrs = new WeakMap();
    this.title = null;
    this.emit("idle");
  }

  private scheduleScan() {
    if (this.scanTimer !== null) return;
    this.scanTimer = window.setTimeout(() => {
      this.scanTimer = null;
      this.scan();
    }, 60);
  }

  private scan() {
    if (!this.active) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
      const value = node.nodeValue ?? "";
      if (this.applied.get(node) === value) continue;
      if (!CYRILLIC.test(value) || skipped(node.parentElement)) {
        this.texts.delete(node);
        continue;
      }
      this.texts.set(node, value);
      this.applyText(node, value);
    }

    for (const el of document.body.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(","))) {
      if (skipped(el)) continue;
      for (const name of ATTRS) {
        const value = el.getAttribute(name);
        if (!value || this.appliedAttrs.get(el)?.get(name) === value || !CYRILLIC.test(value)) continue;
        let sources = this.attrs.get(el);
        if (!sources) this.attrs.set(el, (sources = new Map()));
        sources.set(name, value);
        this.applyAttr(el, name, value);
      }
    }

    if (document.title !== this.title && CYRILLIC.test(document.title)) {
      const source = document.title;
      const done = this.lookup(source);
      if (done) {
        this.title = source;
        document.title = done;
      }
    }

    // Forget nodes React has thrown away.
    for (const node of this.texts.keys()) if (!node.isConnected) this.texts.delete(node);
    for (const el of this.attrs.keys()) if (!el.isConnected) this.attrs.delete(el);

    this.pump();
  }

  /** Cached translation of `source`, or null after queueing it. */
  private lookup(source: string): string | null {
    const [lead, core, trail] = splitSpace(source);
    const hit = this.cache.get(core);
    if (hit !== undefined) return lead + hit + trail;
    if (!this.failed.has(core) && !this.inFlight.has(core)) this.queued.add(core);
    return null;
  }

  private applyText(node: Text, source: string) {
    const fixed = node.parentElement?.getAttribute("data-en");
    const [lead, , trail] = splitSpace(source);
    const done = fixed != null ? lead + fixed + trail : this.lookup(source);
    if (done === null || node.nodeValue === done) return;
    this.applied.set(node, done);
    node.nodeValue = done;
  }

  private applyAttr(el: Element, name: string, source: string) {
    const done = this.lookup(source);
    if (done === null) return;
    let mine = this.appliedAttrs.get(el);
    if (!mine) this.appliedAttrs.set(el, (mine = new Map()));
    mine.set(name, done);
    el.setAttribute(name, done);
  }

  private nextBatch(): string[] {
    const batch: string[] = [];
    let chars = 0;
    for (const text of this.queued) {
      if (batch.length >= BATCH_STRINGS || (batch.length > 0 && chars + text.length > BATCH_CHARS)) break;
      batch.push(text);
      chars += text.length;
    }
    for (const text of batch) {
      this.queued.delete(text);
      this.inFlight.add(text);
    }
    return batch;
  }

  private pump() {
    while (this.active && this.running < CONCURRENCY && this.queued.size > 0) {
      const batch = this.nextBatch();
      this.running++;
      this.emit("translating");
      void this.request(batch).finally(() => {
        this.running--;
        for (const text of batch) this.inFlight.delete(text);
        if (this.active) this.reapply();
        this.pump();
        this.settle();
      });
    }
    this.settle();
  }

  private async request(batch: string[]) {
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: batch }),
      });
      const body = (await res.json().catch(() => ({}))) as { translations?: string[]; error?: string };
      if (!res.ok || !Array.isArray(body.translations) || body.translations.length !== batch.length) {
        throw new Error(body.error === "missing_key" ? "missing_key" : "failed");
      }
      batch.forEach((text, i) => {
        const translated = body.translations![i];
        // Never replace text with nothing — keep the Mongolian instead.
        this.cache.set(text, translated.trim() ? translated : text);
      });
      this.persist();
    } catch (error) {
      for (const text of batch) this.failed.add(text);
      this.emit("error", (error as Error).message === "missing_key" ? "missing_key" : "failed");
    }
  }

  /** Writes freshly arrived translations into every node still waiting for one. */
  private reapply() {
    for (const [node, source] of this.texts) {
      if (node.isConnected && node.nodeValue === source) this.applyText(node, source);
    }
    for (const [el, sources] of this.attrs) {
      for (const [name, source] of sources) {
        if (el.getAttribute(name) === source) this.applyAttr(el, name, source);
      }
    }
    if (this.title === null && CYRILLIC.test(document.title)) this.scan();
  }

  private settle() {
    if (this.running > 0 || this.queued.size > 0) return;
    if (this.failed.size === 0) this.emit("idle");
    const waiters = this.idleWaiters;
    this.idleWaiters = [];
    waiters.forEach((resolve) => resolve());
  }

  private persist() {
    if (this.saveTimer !== null) return;
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(this.cache)));
      } catch {
        // Quota or privacy mode — the in-memory cache still works.
      }
    }, 500);
  }

  private emit(status: TranslatorStatus, error?: TranslatorError) {
    this.listeners.forEach((listener) => listener(status, error));
  }
}
