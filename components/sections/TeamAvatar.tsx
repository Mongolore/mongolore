"use client";

import Image from "next/image";
import { useState } from "react";
import type { TeamMember } from "@/data/team";

/** Photo avatar that falls back to the member's initial if the file is missing. */
export function TeamAvatar({
  member,
  toneClassName,
}: {
  member: TeamMember;
  toneClassName: string;
}) {
  const [failed, setFailed] = useState(false);

  if (member.photo && !failed) {
    return (
      <Image
        src={member.photo}
        alt=""
        width={96}
        height={96}
        className="size-14 shrink-0 rounded-full object-cover ring-1 ring-white/20"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`grid size-14 shrink-0 place-items-center rounded-full font-serif text-2xl font-semibold ring-1 ${toneClassName}`}
    >
      {member.name.charAt(0)}
    </span>
  );
}
