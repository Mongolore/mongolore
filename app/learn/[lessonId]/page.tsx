import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { ERAS } from "@/data/eras";
import { SITE_NAME } from "@/data/site";
import { findLesson, LESSONS } from "@/lib/lessons";

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ lessonId: lesson.id }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[lessonId]">): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = findLesson(lessonId);
  const era = lesson && ERAS.find((e) => e.id === lesson.eraId);
  return { title: lesson && era ? `${era.name}: ${lesson.title} — ${SITE_NAME}` : SITE_NAME };
}

export default async function LessonPage({ params }: PageProps<"/learn/[lessonId]">) {
  const { lessonId } = await params;
  if (!findLesson(lessonId)) notFound();
  return <LessonPlayer lessonId={lessonId} />;
}
