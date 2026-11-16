"use client";

import type { GeoPermissibleObjects } from "d3-geo";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ERAS } from "@/data/eras";
import type { LonLat, PolityRole } from "@/data/historyMaps";

/** The era the landing page opens on: the empire at its widest. */
const START_ERA = "great-mongol";

type EraState = { index: number; setIndex: (index: number) => void };
const EraContext = createContext<EraState | null>(null);

/** One timeline position shared by the globe and the aimag map on the landing page. */
export function EraProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(() => Math.max(0, ERAS.findIndex((e) => e.id === START_ERA)));
  const value = useMemo(() => ({ index, setIndex }), [index]);
  return <EraContext.Provider value={value}>{children}</EraContext.Provider>;
}

/** Falls back to local state when used outside an `EraProvider`. */
export function useEraIndex(): [number, (index: number) => void] {
  const shared = useContext(EraContext);
  const local = useState(ERAS.length - 1);
  return shared ? [shared.index, shared.setIndex] : local;
}

export type PolityProps = {
  name: string | null;
  role: PolityRole | "land";
  label?: string;
  labelAt?: LonLat;
};
export type PolityFeature = { type: "Feature"; properties: PolityProps; geometry: GeoPermissibleObjects };
export type PolityCollection = { type: "FeatureCollection"; features: PolityFeature[] };

const cache = new Map<string, Promise<unknown>>();

/** Fetches a JSON file once per page load, however many components ask for it. */
export function loadJson<T>(url: string): Promise<T> {
  let hit = cache.get(url);
  if (!hit) {
    hit = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return res.json();
    });
    hit.catch(() => cache.delete(url));
    cache.set(url, hit);
  }
  return hit as Promise<T>;
}

export const eraGeoUrl = (id: string) => `/data/history/${id}.geojson`;

/** Borders of one era (public/data/history/<id>.geojson); null until loaded. */
export function useEraGeo(id: string): PolityCollection | null {
  const [loaded, setLoaded] = useState<Record<string, PolityCollection>>({});
  useEffect(() => {
    let live = true;
    loadJson<PolityCollection>(eraGeoUrl(id))
      .then((data) => {
        if (live) setLoaded((all) => (all[id] ? all : { ...all, [id]: data }));
      })
      .catch((err: unknown) => console.error("Түүхэн хилийн өгөгдөл ачаалж чадсангүй", err));
    return () => {
      live = false;
    };
  }, [id]);
  return loaded[id] ?? null;
}
