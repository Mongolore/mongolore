import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Notebook } from "@/components/learn/Notebook";
import { SITE_NAME } from "@/data/site";

export const metadata: Metadata = {
  title: `Алдааны дэвтэр — ${SITE_NAME}`,
  description: "Буруу хариулсан асуултуудаа зөв хариулт, тайлбартай нь харж, дахин давт.",
};

export default function ReviewPage() {
  return (
    <div>
      <PageHeader>
        <Link
          href="/learn"
          aria-label="Суралцах"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-sky-accent"
        >
          <GraduationCap className="size-4" aria-hidden />
          <span className="hidden md:inline">Суралцах</span>
        </Link>
      </PageHeader>
      <main>
        <Notebook />
      </main>
    </div>
  );
}
