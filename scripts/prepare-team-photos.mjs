/**
 * Crops team photos to square avatars in public/team/.
 *
 *   node scripts/prepare-team-photos.mjs
 *
 * Source photos are not kept in the repo. Per photo:
 * - `focusY` / `focusX`: where the face sits in the source (0-1), so the crop
 *   doesn't cut heads off.
 * - `zoom`: crop side as a fraction of the shorter edge (1 = widest square).
 *   Use a smaller value for photos where the face is far from the camera.
 */
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = path.join(homedir(), "Downloads");
const OUT_DIR = new URL("../public/team/", import.meta.url);
const SIZE = 400;

const PHOTOS = [
  { source: "khaliun-photo.JPG", out: "khaliun.jpg", focusY: 0.51 },
  { source: "enerel-photo.jpg", out: "enerel.jpg", focusY: 0.3 },
  { source: "Barkhas-photo.jpg", out: "barkhas.jpg", focusY: 0.42 },
  { source: "nymaa-photo.jpg", out: "nymaa.jpg", focusY: 0.42 },
  // Full-body shot: zoom in on the face.
  { source: "amgalan.jpg", out: "amgalan.jpg", focusX: 0.5, focusY: 0.45, zoom: 0.4 },
];

await mkdir(OUT_DIR, { recursive: true });

for (const photo of PHOTOS) {
  const image = sharp(path.join(SOURCE_DIR, photo.source)).rotate();
  const { width = 0, height = 0 } = await image.metadata();
  const side = Math.round(Math.min(width, height) * (photo.zoom ?? 1));
  const top = Math.round(
    Math.min(Math.max(height * photo.focusY - side / 2, 0), height - side),
  );
  const left = Math.round(
    Math.min(Math.max(width * (photo.focusX ?? 0.5) - side / 2, 0), width - side),
  );

  await image
    .extract({ left, top, width: side, height: side })
    .resize(SIZE, SIZE)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT_DIR.pathname, photo.out));

  console.log(`${photo.source} → public/team/${photo.out} (${side}px from y=${top})`);
}
