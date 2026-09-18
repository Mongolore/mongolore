/**
 * Team members for the "Бид хэн бэ?" section.
 * - `role`: shown under the name.
 * - `school`: where the member studies; omit if unknown.
 * - `photo`: path under `public/` (e.g. "/team/khaliun.jpg"). If the file is
 *   missing the card falls back to an initials avatar, so a path can be listed
 *   before the photo is added.
 */
export type TeamMember = {
  name: string;
  role: string;
  school?: string;
  photo?: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Халиун",
    role: "Үүрэг",
    school: "Absolute Elite",
    photo: "/team/khaliun.jpg",
  },
  {
    name: "Энэрэл",
    role: "Үүрэг",
    school: "Australian Smart School of Ulaanbaatar (ASSU)",
    photo: "/team/enerel.jpg",
  },
  {
    name: "Бархас",
    role: "Үүрэг",
    school: "130-р сургууль",
    photo: "/team/barkhas.jpg",
  },
  {
    name: "Нямаа",
    role: "Үүрэг",
    school: "82-р сургууль",
    photo: "/team/nymaa.jpg",
  },
  {
    name: "Амгалан",
    role: "Үүрэг",
    school: "American School of Ulaanbaatar",
    photo: "/team/amgalan.jpg",
  },
];
