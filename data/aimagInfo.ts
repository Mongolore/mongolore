/**
 * Historical content shown in the info card when a region is clicked.
 * Add events per ISO code (see `data/aimags.ts`); regions without events
 * show `AIMAG_INFO_PLACEHOLDER`.
 */
export type HistoricalEvent = {
  title: string;
  /** Free-form period label, e.g. "1206 он" or "МЭӨ 209". */
  period: string;
  summary: string;
};

export const AIMAG_INFO_PLACEHOLDER =
  "Энэ аймгийн түүхэн үйл явдлууд удахгүй нэмэгдэнэ";

export const AIMAG_EVENTS: Record<string, HistoricalEvent[]> = {
  // "MN-055": [
  //   { title: "Хархорум хот байгуулагдсан", period: "1220 он", summary: "..." },
  // ],
};
