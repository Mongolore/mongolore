import { ArrowRight, Flame, Heart, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { DailyQuestion } from "../learn/DailyQuestion";
import { StatsPanel } from "../learn/StatsPanel";
import { Reveal } from "../Reveal";
import { SectionHeading } from "./SectionHeading";

const PERKS = [
  { icon: Zap, title: "XP цуглуул", text: "Зөв хариулт бүр 10 XP, 3 дараалан зөв бол урамшуулал.", tone: "text-gold-soft" },
  { icon: Flame, title: "Цуваагаа бүү тасал", text: "Өдөр бүр ядаж нэг хичээл — цуваа чинь өснө.", tone: "text-orange-300" },
  { icon: Heart, title: "3 амь", text: "Буруу хариулт бүр нэг амь. Алдсан асуулт сүүлд дахин гарна.", tone: "text-rose-300" },
  { icon: Trophy, title: "Шинэ аянчнаас Их хаан хүртэл", text: "XP-ээр түвшин ахиж, шинэ цол авна.", tone: "text-sky-soft" },
];

export function LearnPromo() {
  return (
    <section aria-labelledby="learn-title" id="learn" className="scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading id="learn-title" title="Тоглож суралц" />
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Газрын зураг дээр үзсэн түүхээ богино хичээлээр бататга. Бүлэг бүр нэг эрин үе — хамгийн эртний Хүннүгээс
            өнөөгийн Монгол хүртэл.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-6">
            <ul className="grid gap-3 sm:grid-cols-2">
              {PERKS.map(({ icon: Icon, title, text, tone }, i) => (
                <li key={title}>
                  <Reveal delay={i * 0.05} className="h-full">
                    <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-white/25">
                      <Icon className={`size-6 ${tone}`} aria-hidden />
                      <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
            <DailyQuestion />
          </div>

          <div className="space-y-4">
            <StatsPanel compact />
            <Link
              href="/learn"
              className="group flex items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-4 text-lg font-extrabold tracking-wide text-navy-950 uppercase shadow-[0_5px_0_#a87a23] transition hover:bg-gold-soft active:translate-y-1 active:shadow-none"
            >
              Хичээл эхлүүлэх
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
