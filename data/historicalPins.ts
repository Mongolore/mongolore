/**
 * Decorative gold pins on the hero map. Coordinates are [longitude, latitude]
 * and approximate — replace them with verified locations as content grows.
 */
export type HistoricalPin = {
  id: string;
  name: string;
  coordinates: [number, number];
};

export const HISTORICAL_PINS: HistoricalPin[] = [
  { id: "kharkhorum", name: "Хархорум", coordinates: [102.84, 47.2] },
  { id: "khodoo-aral", name: "Хөдөө арал", coordinates: [109.9, 47.1] },
  { id: "amarbayasgalant", name: "Амарбаясгалант хийд", coordinates: [105.09, 49.48] },
  { id: "khalkhyn-gol", name: "Халх гол", coordinates: [118.6, 47.6] },
  { id: "tsenkher-cave", name: "Цэнхэрийн агуй", coordinates: [91.95, 48.3] },
];
