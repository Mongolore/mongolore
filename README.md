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
