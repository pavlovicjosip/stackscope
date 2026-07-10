"use client";

import { useState } from "react";
import type { KnowledgeCheck } from "@/content/types";

export function KnowledgeCheckCard({ checks, objectives }: { checks: KnowledgeCheck[]; objectives: string[] }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const check = checks[questionIndex];
  const correct = answer === check.answer;

  function choose(index: number) {
    if (answer !== null) return;
    if (index === check.answer) setCorrectAnswers((value) => value + 1);
    setAnswer(index);
  }

  function next() {
    setQuestionIndex((value) => Math.min(value + 1, checks.length - 1));
    setAnswer(null);
  }

  return (
    <section className="knowledge-check" aria-labelledby="check-heading">
      <span className="section-index">QUICK CHECK · {questionIndex + 1} / {checks.length}</span>
      <h2 id="check-heading">{check.question}</h2>
      <p className="check-objective">Objective: {objectives[check.objectiveIndex]}</p>
      <div className="check-options">
        {check.options.map((option, index) => (
          <button type="button" key={option} className={answer === index ? (correct ? "is-correct" : "is-wrong") : ""} onClick={() => choose(index)} aria-pressed={answer === index} disabled={answer !== null}>
            <span>{String.fromCharCode(65 + index)}</span>{option}
          </button>
        ))}
      </div>
      {answer !== null && <div className={`check-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status"><strong>{correct ? "Exactly." : "Not quite."}</strong> {check.explanation}</div>}
      {answer !== null && questionIndex < checks.length - 1 && <button className="check-next" type="button" onClick={next}>Next question →</button>}
      {answer !== null && questionIndex === checks.length - 1 && <p className="check-score" role="status">You answered {correctAnswers} of {checks.length} correctly.</p>}
    </section>
  );
}
