import { ArrowUp } from "lucide-react";
import { FOOTER, NAV_LINKS, SITE_NAME, SITE_YEAR } from "@/data/site";
import { TEAM } from "@/data/team";
import { Logo } from "../Logo";
import { OrnamentBand } from "../Ornament";

export function Footer() {
  return (
    <footer className="bg-navy-950">
      <OrnamentBand className="text-gold/30" />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-16 pb-10 sm:px-8 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <a href="#top" className="text-2xl text-ink">
            <Logo />
          </a>
        </div>

        <div>
          <h2 className="text-xs font-semibold tracking-[0.18em] text-faint uppercase">
            {FOOTER.teamLabel}
          </h2>
          <ul className="mt-4 space-y-2 text-ink/90">
            {TEAM.map((member) => (
              <li key={member.name}>{member.name}</li>
            ))}
          </ul>
        </div>

        <nav aria-label="Хөлийн цэс">
          <h2 className="text-xs font-semibold tracking-[0.18em] text-faint uppercase">
            {FOOTER.navLabel}
          </h2>
          <ul className="mt-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-ink/90 transition-colors hover:text-sky-accent">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-6 text-sm text-faint sm:px-8">
        <p>
          © {SITE_YEAR} {SITE_NAME}
        </p>
        <a href="#top" className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
          {FOOTER.backToTop}
          <ArrowUp className="size-3.5" aria-hidden />
        </a>
      </div>
    </footer>
  );
}
