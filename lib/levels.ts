/** Level ranks and the XP needed for each — shared by the client and the progress API. */

export const LEVEL_TITLES = [
  "Шинэ аянчин",
  "Тал нутгийн хүүхэд",
  "Морьт харваач",
  "Аравтын дарга",
  "Зуутын дарга",
  "Мянганы ноён",
  "Түмний жанжин",
  "Мэргэн түүхч",
  "Их хаан",
];

export function levelInfo(xp: number) {
  let level = 1;
  let floor = 0;
  let need = 60;
  while (xp >= floor + need) {
    floor += need;
    level++;
    need = Math.round(need * 1.25);
  }
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    into: xp - floor,
    need,
  };
}

