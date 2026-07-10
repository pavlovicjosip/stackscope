import Link from "next/link";
import type { LessonSummary } from "@/content/types";

export function LessonCard({ lesson, index, dark = false }: { lesson: LessonSummary; index: number; dark?: boolean }) {
  return (
    <article className={`lesson-card${dark ? " lesson-card--dark" : ""}`}>
      <div className="lesson-card__top"><span>{String(index).padStart(2, "0")}</span><span>{lesson.duration} MIN · LEVEL {lesson.difficulty}</span></div>
      <div className="lesson-card__diagram" aria-hidden="true">
        {lesson.previewKinds.map((kind, nodeIndex) => (
          <span className={`mini-node mini-node--${kind}`} key={`${kind}-${nodeIndex}`} style={{ left: `${8 + nodeIndex * 20}%`, top: `${nodeIndex % 2 === 0 ? 35 : 58}%` }} />
        ))}
        <i />
      </div>
      <div className="lesson-card__body">
        <span className="lesson-card__eyebrow">{lesson.eyebrow}</span>
        <h3><Link href={`/learn/${lesson.slug}/`}>{lesson.title}</Link></h3>
        <p>{lesson.summary}</p>
        <div className="tag-row">{lesson.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}</div>
      </div>
      <Link className="lesson-card__link" href={`/learn/${lesson.slug}/`} aria-label={`Open ${lesson.title}`}>Open flow <span>↗</span></Link>
    </article>
  );
}
