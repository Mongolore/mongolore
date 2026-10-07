# ТҮҮХ MAP

Монголын түүхийг интерактив газрын зургаар үзүүлэх веб платформын нүүр хуудас.
Next.js (App Router), TypeScript, Tailwind CSS дээр бүтээв.

## Ажиллуулах

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
npm run check:data   # контентын өгөгдлийг шалгана
```

## Тохиргоо (.env.local)

`.env.example`-ийг `.env.local` нэрээр хуулж, түлхүүрүүдээ оруулна. Дараа нь `npm run dev`-ээ дахин ажиллуулна.
**Жинхэнэ түлхүүрийг `.env.example`-д бүү бич** — тэр файл git-д орно.

| Хувьсагч | Юунд хэрэгтэй |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Нэвтрэх (publishable түлхүүр) |
| `SUPABASE_SECRET_KEY` | Бүртгэл үүсгэх, XP хадгалах (зөвхөн серверт) |
| `ANTHROPIC_API_KEY` | Заавал биш. Байвал орчуулгыг Claude хийнэ, үгүй бол үнэгүй Google Translate |

**Supabase хүснэгт үүсгэх (нэг удаа):** Supabase → SQL Editor → New query → `supabase/migrations/0001_profiles_and_progress.sql`
файлын агуулгыг бүхэлд нь хуулж → Run. Ингэснээр `profiles` (нэр, XP, түвшин, цуваа) ба `lesson_progress`
(дууссан хичээл, од) хүснэгтүүд үүснэ. Бүртгэл шууд баталгаажна (имэйл хүлээхгүй).

Дуут тайлбар Microsoft-ын үнэгүй neural хоолойг ашиглана (`mn-MN-YesuiNeural`, `app/api/tts`) — түлхүүр хэрэггүй.

## Суралцах хэсэг (/learn)

- Эрин үе бүр 3 хичээлтэй бүлэг. Асуултууд `data/` доторх өгөгдлөөс автоматаар үүснэ (`lib/lessons.ts`).
- XP, түвшин, өдөр бүрийн цуваа, өдрийн зорилго, 3 амь — `lib/progress.tsx`.
- Дуут тайлбар: түүхийн мэдээлэл бүрт «Сонсох» товч бий (`components/ListenButton.tsx`). Товчийг дарахад тухайн
  хэсгийг монгол AI хоолойгоор уншина; англи горимд англиар уншина.

## Контент засварлах

Бүх агуулга `data/` доторх файлуудад байдаг — компонент дотор бичигдээгүй.

| Файл | Юуг агуулах |
| --- | --- |
| `data/site.ts` | Хуудасны бичвэр, цэсний холбоосууд |
| `data/team.ts` | Багийн гишүүд: нэр, үүрэг, сургууль, зураг |
| `data/features.ts` | Боломжуудын жагсаалт (`implemented: true` болгоход "Ашиглах боломжтой" болно) |
| `data/eras.ts` | Цаг хугацааны шугамын үеүүд, тэдгээрийн түүхэн газрууд |
| `data/aimags.ts` | 22 бүсийн монгол нэр (ISO кодоор) |
| `data/aimagInfo.ts` | Аймаг дээр дарахад гарах мэдээлэл |
| `data/neighbours.ts` | Хөрш орнуудын нэр, шошгоны байрлал |

Засварласны дараа `npm run check:data` ажиллуулж, алдаагүйг шалгана.

## Газрын зургийн өгөгдөл

`public/data/` доторх GeoJSON файлууд:

- `mongolia-aimags.geojson` — 21 аймаг + Улаанбаатар ([geoBoundaries](https://www.geoboundaries.org/), gbOpen MNG ADM1)
- `mongolia-outline.geojson` — улсын хил (аймгуудаас нэгтгэсэн)
- `neighbours.geojson` — хөрш орнууд ([Natural Earth](https://www.naturalearthdata.com/), 110m)

Шинэ файл татсан бол дараах командыг ажиллуулна. Энэ нь d3-geo-д
тохируулан цагираг эргүүлж, 22 бүс бүрийн нэрийг шалгана:

```bash
npm run map:prepare
```

## Багийн зураг

`public/team/` дотор `<нэр>.jpg` нэртэйгээр хадгална. Дөрвөлжин зураг
хэрэгтэй бол `node scripts/prepare-team-photos.mjs` ашиглана
(эх зургууд `~/Downloads` дотор байх ёстой). Зураг байхгүй гишүүн
нэрийн эхний үсгээр харагдана.
