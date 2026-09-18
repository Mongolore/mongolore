import { useId } from "react";

/**
 * A thin band of the traditional хээ (key/meander) pattern.
 * Purely decorative.
 */
export function OrnamentBand({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg aria-hidden className={`block h-3 w-full ${className}`} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="16" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M0 11.5H16M2 11.5V1.5H14V8.5H6V4.5H10.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill={`url(#${id})`} />
    </svg>
  );
}

/** A small four-petal өлзий-style mark used as a divider. */
export function OrnamentMark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="8" y="8" width="8" height="8" transform="rotate(45 12 12)" />
        <path d="M12 1v5M12 18v5M1 12h5M18 12h5" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      </g>
    </svg>
  );
}
