import {
  AudioLines,
  Award,
  Box,
  CalendarRange,
  FileText,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  MonitorSmartphone,
  Search,
  type LucideIcon,
} from "lucide-react";

/**
 * Platform features for the "Боломжууд" section.
 * Set `implemented: true` once a feature ships — it moves into the
 * "Ашиглах боломжтой" group with a green badge. Everything else is listed
 * under "Удахгүй".
 */
export type Feature = {
  /** Stable key, used to link features to other parts of the page. */
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  implemented: boolean;
};

export const FEATURES: Feature[] = [
  {
    id: "map",
    title: "Интерактив газрын зураг",
    description: "Аймаг, сумын хил бүхий газрын зураг дээр түүхэн үйл явдлыг цэгээр харуулна.",
    icon: MapPinned,
    implemented: false,
  },
  {
    id: "timeline",
    title: "Цаг хугацааны шугам",
    description: "МЭӨ 209 оноос өнөөг хүртэлх эрин үеээр газрын зургийг шүүнэ.",
    icon: CalendarRange,
    implemented: false,
  },
  {
    id: "event-page",
    title: "Үйл явдлын хуудас",
    description: "Товч агуулга, зураг, байршил, холбоотой үйл явдал, эх сурвалж.",
    icon: FileText,
    implemented: false,
  },
  {
    id: "audio",
    title: "Монгол аудио тайлбар",
    description: "Текстийг монгол яриа болгож, хурдыг тохируулан сонсоно.",
    icon: AudioLines,
    implemented: false,
  },
  {
    id: "search",
    title: "Хайлт ба шүүлтүүр",
    description: "Эрин үе, ангилал, аймаг, сумаар хайна.",
    icon: Search,
    implemented: false,
  },
  {
    id: "responsive",
    title: "Бүх төхөөрөмжид тохирсон",
    description: "Утас, таблет, компьютер дээр ажиллана.",
    icon: MonitorSmartphone,
    implemented: false,
  },
  {
    id: "admin",
    title: "Админ самбар",
    description: "Контент нэмж, шалгаад нийтэлнэ.",
    icon: LayoutDashboard,
    implemented: false,
  },
  {
    id: "artifacts-3d",
    title: "3D олдвор",
    description: "Эртний олдворыг эргүүлж, ойроос харна.",
    icon: Box,
    implemented: false,
  },
  {
    id: "quiz",
    title: "Түүхийн сорил",
    description: "Эрин үе бүрийн богино асуултууд.",
    icon: ListChecks,
    implemented: false,
  },
  {
    id: "progress",
    title: "Ахиц ба тэмдэг",
    description: "Үзсэн үйл явдал, авсан шагналаа хянана.",
    icon: Award,
    implemented: false,
  },
];
