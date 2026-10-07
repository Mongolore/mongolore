"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const COLORS = ["#e8b04b", "#f3cd82", "#4fa3e0", "#8cc6ef", "#f1ede4", "#fb923c", "#86efac"];

/** A one-shot burst of confetti from the top of its container. */
export function Confetti({ count = 70 }: { count?: number }) {
  const reduce = useReducedMotion();
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      drift: (Math.random() - 0.5) * 240,
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.35,
      duration: 1.8 + Math.random() * 1.4,
      size: 6 + Math.random() * 7,
      color: COLORS[i % COLORS.length],
      round: Math.random() < 0.35,
    })),
  );
  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[85] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? "9999px" : "2px",
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", x: p.drift, rotate: p.rotate, opacity: [1, 1, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
