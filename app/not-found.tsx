import { Compass } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function NotFound() {
  return (
    <div>
      <PageHeader />
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col items-center justify-center px-5 text-center">
        <Compass className="size-14 text-gold" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl font-bold text-ink">Энэ хуудас олдсонгүй</h1>
        <p className="mt-2 text-muted">Түүхийн зам андуурсан бололтой. Газрын зураг руугаа буцъя.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-2xl bg-gold px-6 py-3 font-bold text-navy-950 hover:bg-gold-soft">
            Нүүр хуудас
          </Link>
          <Link href="/map" className="rounded-2xl border border-white/15 px-6 py-3 font-bold text-ink hover:bg-white/5">
            Газрын зураг
          </Link>
        </div>
      </main>
    </div>
  );
}
