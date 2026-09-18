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
