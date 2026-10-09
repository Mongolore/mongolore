/**
 * Team members for the "Бид хэн бэ?" section.
 * - `name`: in Mongolian Cyrillic. `nameEn`: the same name in Latin letters,
 *   shown in English mode — written the way it sounds, never translated
 *   (Амгалан → Amgalan, not "Peace").
 * - `role`: shown under the name.
 * - `school`: where the member studies; omit if unknown.
 * - `photo`: path under `public/` (e.g. "/team/khaliun.jpg"). If the file is
 *   missing the card falls back to an initials avatar, so a path can be listed
 *   before the photo is added.
 */
export type TeamMember = {
  name: string;
  nameEn: string;
  role: string;
  school?: string;
  photo?: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Халиун",
    nameEn: "Khaliun",
    role: "Frontend Developer",
    school: "Absolute Elite",
    photo: "/team/khaliun.jpg",
  },
  {
    name: "Энэрэл",
    nameEn: "Enerel",
    role: "Fullstack Developer",
    school: "Australian Smart School of Ulaanbaatar (ASSU)",
    photo: "/team/enerel.jpg",
  },
  {
    name: "Бархас",
    nameEn: "Barkhas",
    role: "Үүрэг",
    school: "130-р сургууль",
    photo: "/team/barkhas.jpg",
  },
  {
    name: "Нямлхагва",
    nameEn: "Nyamaa",
    role: "Researcher",
    school: "82-р сургууль",
    photo: "/team/nymaa.jpg",
  },
  {
    name: "Жэйсон Амгалан",
    nameEn: "Jason Amgalan",
    role: "Backend Developer",
    school: "American School of Ulaanbaatar",
    photo: "/team/amgalan.jpg",
  },
];
