import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/lesson-player";
import { lessons } from "@/content/lessons";
import { getLesson } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() { return lessons.map((lesson) => ({ lessonSlug: lesson.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ lessonSlug: string }> }): Promise<Metadata> {
  const lesson = getLesson((await params).lessonSlug);
  return lesson ? { title: lesson.title, description: lesson.summary } : {};
}
export default async function LessonPage({ params }: { params: Promise<{ lessonSlug: string }> }) {
  const lesson = getLesson((await params).lessonSlug);
  if (!lesson) notFound();
  return <main id="main-content" className="lesson-page"><LessonPlayer lesson={lesson} /></main>;
}
