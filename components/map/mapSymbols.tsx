import type { PlaceKind, RouteKind } from "@/data/historyMaps";

/** Map symbol for a place, centred on 0,0; drawn inside an existing <svg>. */
export function PlaceSymbol({ kind }: { kind: PlaceKind }) {
  switch (kind) {
    case "capital":
      return (
        <>
          <circle r={6.5} fill="none" stroke="#E8B04B" strokeWidth={1.2} />
          <circle r={3.6} fill="#F3CD82" stroke="#0F172E" strokeWidth={1} />
        </>
      );
    case "ordo":
      return (
        <>
          <circle r={4.8} fill="#0F172E" stroke="#E8B04B" strokeWidth={1.6} />
          <circle r={1.6} fill="#E8B04B" />
        </>
      );
    case "city":
      return <rect x={-3.2} y={-3.2} width={6.4} height={6.4} fill="#F1EDE4" stroke="#0F172E" strokeWidth={1} />;
    case "fortress":
      return <rect x={-4} y={-4} width={8} height={8} fill="#0F172E" stroke="#8CC6EF" strokeWidth={1.6} />;
    case "battle":
      return (
        <>
          <circle r={5.6} fill="#0F172E" stroke="#E0654F" strokeWidth={1.2} />
          <path d="M-2.8 -2.8 2.8 2.8M2.8 -2.8 -2.8 2.8" stroke="#E0654F" strokeWidth={1.6} strokeLinecap="round" />
        </>
      );
    case "monument":
      return <path d="M0 -5.2 4.6 3.6 -4.6 3.6Z" fill="#C4A0E8" stroke="#0F172E" strokeWidth={1} />;
  }
}

/** A short line in the route's style, for legends and lists. */
export function RouteSwatch({ kind }: { kind: RouteKind }) {
  return (
    <svg aria-hidden width="26" height="10" className="shrink-0">
      <path d="M2 5H24" className={`route route-${kind}`} />
    </svg>
  );
}
