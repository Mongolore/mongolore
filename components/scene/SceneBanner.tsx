"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { SceneId } from "@/data/scenes";
import { drawScene } from "./sceneEngine";

type SceneBannerProps = {
  scene: SceneId;
  /** A still frame instead of a running scene — for pages that show many at once. */
  still?: boolean;
  className?: string;
};

/** A scene from the engine as an illustration inside the page. */
export function SceneBanner({ scene, still = false, className = "" }: SceneBannerProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const frozen = still || reduceMotion;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const camera = { x: -8, px: 0, py: 0 };
    const paint = (time: number) => {
      if (width === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(ctx, width, height, time, camera, scene);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (frozen) paint(6300);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (frozen) return () => observer.disconnect();

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      camera.x = -8 + Math.sin(now / 6000) * 6;
      paint(now - start + 6300);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      io.disconnect();
    };
  }, [scene, frozen]);

  return <canvas ref={ref} aria-hidden className={`block size-full ${className}`} />;
}
