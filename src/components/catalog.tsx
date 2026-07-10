"use client";

import { useMemo, useState } from "react";
import { LessonCard } from "./lesson-card";
import type { LessonSummary, NodeKind } from "@/content/types";

export function Catalog({ lessons }: { lessons: LessonSummary[] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const [level, setLevel] = useState(0);
  const [layer, setLayer] = useState<NodeKind | "all">("all");
  const topics = ["All", ...Array.from(new Set(lessons.flatMap((lesson) => lesson.topics))).sort()];
  const layers = Array.from(new Set(lessons.flatMap((lesson) => lesson.layers))).sort();
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesTopic = topic === "All" || lesson.topics.includes(topic);
      const matchesLevel = level === 0 || lesson.difficulty === level;
      const matchesLayer = layer === "all" || lesson.layers.includes(layer);
      return matchesTopic && matchesLevel && matchesLayer && (!normalized || lesson.searchText.includes(normalized));
    });
  }, [layer, lessons, level, query, topic]);

  return (
    <>
      <div className="catalog-controls">
        <label className="search-box"><span className="sr-only">Search lessons</span><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a technology or scenario" /></label>
        <div className="topic-tabs" aria-label="Filter by topic">
          {topics.map((item) => <button className={topic === item ? "is-active" : ""} key={item} onClick={() => setTopic(item)} type="button">{item}</button>)}
        </div>
        <div className="level-filter" aria-label="Filter by experience level">
          {[0, 1, 2, 3].map((item) => <button className={level === item ? "is-active" : ""} key={item} onClick={() => setLevel(item)} type="button">{item === 0 ? "All levels" : `Level ${item}`}</button>)}
        </div>
        <label className="layer-filter"><span>Architecture layer</span><select aria-label="Filter by architecture layer" value={layer} onChange={(event) => setLayer(event.target.value as NodeKind | "all")}><option value="all">All layers</option>{layers.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label>
      </div>
      <p className="result-count" aria-live="polite">{filtered.length} guided {filtered.length === 1 ? "system" : "systems"}</p>
      {filtered.length > 0 ? (
        <div className="lesson-grid lesson-grid--catalog">{filtered.map((lesson) => <LessonCard lesson={lesson} index={lessons.indexOf(lesson) + 1} key={lesson.slug} />)}</div>
      ) : <div className="empty-state"><strong>No matching systems.</strong><p>Try a broader topic or remove the search term.</p></div>}
    </>
  );
}
