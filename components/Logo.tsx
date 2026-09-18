import { SITE_NAME } from "@/data/site";

export function Logo({ className = "" }: { className?: string }) {
  const [first, ...rest] = SITE_NAME.split(" ");
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 28 28" className="size-7 shrink-0" aria-hidden>
        <path
          d="M3 20.5 9.5 10l4.5 6.2 3.3-4.2L25 20.5"
          fill="none"
          stroke="#8CC6EF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M3 24h22" stroke="#8CC6EF" strokeOpacity=".4" strokeWidth="1.2" />
        <circle cx="19" cy="6" r="2.4" fill="#E8B04B" />
      </svg>
      <span className="font-serif text-[1.15em] font-bold tracking-tight">
        {first}
        <span className="ml-1.5 font-sans text-[0.72em] font-semibold tracking-[0.2em] text-gold">
          {rest.join(" ")}
        </span>
      </span>
    </span>
  );
}
