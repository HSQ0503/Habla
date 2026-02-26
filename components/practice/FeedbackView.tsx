"use client";

import { useState } from "react";
import Link from "next/link";
import type { FeedbackResult, ChatMessage, CriterionGrade } from "@/lib/types";
import TranscriptView from "./TranscriptView";

type Props = {
  feedback: FeedbackResult;
  transcript: ChatMessage[];
  imageUrl: string;
};

function scoreBannerColor(total: number) {
  if (total >= 20) return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" };
  if (total >= 12) return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" };
  return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" };
}

function overallBand(total: number) {
  if (total >= 25) return "Excellent";
  if (total >= 20) return "Good";
  if (total >= 15) return "Satisfactory";
  if (total >= 10) return "Developing";
  return "Needs Improvement";
}

function CriterionCard({
  name,
  maxMark,
  grade,
}: {
  name: string;
  maxMark: number;
  grade: CriterionGrade;
}) {
  const pct = maxMark > 0 ? (grade.mark / maxMark) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
        <span className="text-lg font-bold text-gray-900">
          {grade.mark}<span className="text-sm font-normal text-gray-400">/{maxMark}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mb-3">Band: {grade.band}</p>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{grade.justification}</p>

      {/* Strengths */}
      {grade.strengths.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-green-700 mb-1.5">Strengths</p>
          <ul className="space-y-1">
            {grade.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-green-600">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {grade.improvements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-700 mb-1.5">To Improve</p>
          <ul className="space-y-1">
            {grade.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function FeedbackView({ feedback, transcript, imageUrl }: Props) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  if (showTranscript) {
    return <TranscriptView transcript={transcript} onBack={() => setShowTranscript(false)} />;
  }

  const { ibGrades, quantitative } = feedback;
  const bannerColor = scoreBannerColor(ibGrades.totalMark);
  const band = overallBand(ibGrades.totalMark);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Image thumbnail + score banner */}
      <div className={`rounded-xl border ${bannerColor.border} ${bannerColor.bg} p-6 mb-6`}>
        <div className="flex items-start gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Session image"
            className="w-20 h-20 rounded-lg object-cover border border-gray-200 shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-baseline gap-3 mb-1">
              <span className={`text-4xl font-bold ${bannerColor.text}`}>
                {ibGrades.totalMark}
              </span>
              <span className="text-lg text-gray-400 font-medium">/30</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${bannerColor.bg} ${bannerColor.text} border ${bannerColor.border}`}>
                {band}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{ibGrades.overallSummary}</p>
          </div>
        </div>
      </div>

      {/* Top strengths & improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
            Top Strengths
          </h3>
          <ul className="space-y-1.5">
            {ibGrades.topStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            Priority Improvements
          </h3>
          <ul className="space-y-1.5">
            {ibGrades.priorityImprovements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Criterion cards (2x2 grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CriterionCard name="A — Language" maxMark={12} grade={ibGrades.criterionA} />
        <CriterionCard name="B1 — Visual Stimulus" maxMark={6} grade={ibGrades.criterionB1} />
        <CriterionCard name="B2 — Conversation" maxMark={6} grade={ibGrades.criterionB2} />
        <CriterionCard name="C — Interactive Skills" maxMark={6} grade={ibGrades.criterionC} />
      </div>

      {/* Collapsible detailed metrics */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>Detailed Metrics</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showMetrics ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showMetrics && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-5">
            {/* Tense Usage */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Tense Usage
              </h4>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-700">
                  Variety: <span className="font-semibold">{quantitative.tenses.varietyScore}/10</span>
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-sm text-gray-700">
                  Dominant: <span className="font-medium">{quantitative.tenses.dominantTense}</span>
                </span>
              </div>
              {quantitative.tenses.tensesFound.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quantitative.tenses.tensesFound.map((t) => (
                    <span
                      key={t.tense}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                    >
                      {t.tense}
                      <span className="text-indigo-400 font-medium">{t.count}</span>
                    </span>
                  ))}
                </div>
              )}
              {quantitative.tenses.missingTenses.length > 0 && (
                <p className="text-xs text-gray-500">
                  Missing: {quantitative.tenses.missingTenses.join(", ")}
                </p>
              )}
            </div>

            {/* Vocabulary */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Vocabulary
              </h4>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-700">
                  CEFR Level: <span className="font-semibold">{quantitative.vocabulary.estimatedLevel}</span>
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-sm text-gray-700">
                  Diversity: <span className="font-semibold">{quantitative.vocabulary.lexicalDiversity}</span>
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-sm text-gray-700">
                  Complexity: <span className="font-semibold">{quantitative.vocabulary.complexityScore}/10</span>
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                {quantitative.vocabulary.wordDistribution.map((d) => (
                  <span
                    key={d.level}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200"
                  >
                    {d.level}: {d.percentage}%
                  </span>
                ))}
              </div>
              {quantitative.vocabulary.advancedWords.length > 0 && (
                <p className="text-xs text-gray-500">
                  Advanced words: {quantitative.vocabulary.advancedWords.join(", ")}
                </p>
              )}
            </div>

            {/* Response Depth */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Response Depth
              </h4>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-700">
                  Overall: <span className="font-semibold">{quantitative.depth.overallScore}/10</span>
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-sm text-gray-700">
                  Avg Length: <span className="font-semibold">{quantitative.depth.averageResponseLength} words</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Strongest: <span className="text-green-600 font-medium">{quantitative.depth.strongestFactor}</span></span>
                <span>Weakest: <span className="text-amber-600 font-medium">{quantitative.depth.weakestFactor}</span></span>
              </div>
            </div>

            {/* Speaking Pace */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Speaking Pace
              </h4>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-700">
                  Overall: <span className="font-semibold">{quantitative.pace.overallWPM} WPM</span>
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-sm text-gray-700">
                  Rating: <span className="font-semibold">{quantitative.pace.fluencyRating}</span>
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-sm text-gray-700">
                  Score: <span className="font-semibold">{quantitative.pace.fluencyScore}/10</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Presentation: {quantitative.pace.presentationWPM} WPM</span>
                <span>Conversation: {quantitative.pace.conversationWPM} WPM</span>
                <span>Variability: {quantitative.pace.paceVariability}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/student/practice"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Practice Again
        </Link>
        <button
          onClick={() => setShowTranscript(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          View Full Transcript
        </button>
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
