import { GraduationCap } from "lucide-react";
import { TEAM_SECTION } from "@/data/site";
import { TEAM } from "@/data/team";
import { TeamAvatar } from "./TeamAvatar";
import { Reveal } from "../Reveal";
import { SectionHeading } from "./SectionHeading";

const AVATAR_TONES = [
  "bg-[#4FA3E0]/15 text-[#8CC6EF] ring-[#4FA3E0]/40",
  "bg-[#E8B04B]/15 text-[#F3CD82] ring-[#E8B04B]/40",
  "bg-[#7FB7A4]/15 text-[#A6D3C3] ring-[#7FB7A4]/40",
  "bg-[#A7A2E0]/15 text-[#C6C2F0] ring-[#A7A2E0]/40",
  "bg-[#D98B6F]/15 text-[#EDB39E] ring-[#D98B6F]/40",
];

export function WhoWeAre() {
  return (
    <section aria-labelledby="team-title" id="team" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center lg:gap-20">
        <Reveal>
          <SectionHeading id="team-title" title={TEAM_SECTION.title}>
            <p className="mt-7 max-w-xl text-xl leading-relaxed text-ink/90 sm:text-2xl">
              {TEAM_SECTION.intro}
            </p>
          </SectionHeading>
        </Reveal>

        <Reveal delay={0.1} className="min-w-0">
          <h3 className="text-xs font-semibold tracking-[0.2em] text-faint uppercase">
            {TEAM_SECTION.rosterLabel}
          </h3>
          <ul className="mt-4 border-t border-white/10">
            {TEAM.map((member, i) => (
              <li
                key={member.name}
                className="group flex items-center gap-4 border-b border-white/10 py-4 transition-colors hover:bg-white/[0.025]"
              >
                <TeamAvatar
                  member={member}
                  toneClassName={AVATAR_TONES[i % AVATAR_TONES.length]}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-xl font-semibold text-ink" data-en={member.nameEn}>
                    {member.name}
                  </p>
                  <p className="text-sm text-muted">{member.role}</p>
                  {member.school && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
                      <GraduationCap className="size-3.5 shrink-0" aria-hidden />
                      <span className="min-w-0 truncate">{member.school}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
