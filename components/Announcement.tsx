import { ArrowRight } from "lucide-react";
import { ANNOUNCEMENT } from "@/data/site";

export function Announcement() {
  return (
    <div className="border-b border-white/10 bg-navy-950 text-[13px]">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2 text-center text-muted sm:px-8">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-gold/60 motion-reduce:hidden" />
            <span className="relative size-2 rounded-full bg-gold" />
          </span>
          {ANNOUNCEMENT.text}
        </span>
        <a
          href={ANNOUNCEMENT.link.href}
          className="group inline-flex items-center gap-1 font-medium text-sky-soft underline-offset-4 hover:underline"
        >
          {ANNOUNCEMENT.link.label}
          <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
        </a>
      </p>
    </div>
  );
}
