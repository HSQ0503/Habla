"use client";

import type { FeedbackResult } from "@/lib/types";

type Props = {
  feedback: FeedbackResult;
};

function BarItem({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function SessionAnalytics({ feedback }: Props) {
  const { quantitative } = feedback;
  const { tenses, vocabulary, depth, pace } = quantitative;

  return (
    <div className="space-y-6">
      {/* Tense Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tense Usage</h3>
        {tenses.tensesFound.length > 0 && (
          <div className="space-y-2 mb-4">
            {tenses.tensesFound
              .sort((a, b) => b.count - a.count)
              .map((t) => (
                <BarItem
                  key={t.tense}
                  label={t.tense}
                  value={t.count}
                  max={Math.max(...tenses.tensesFound.map((x) => x.count))}
                />
              ))}
          </div>
        )}
        {tenses.missingTenses.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Missing Tenses</p>
            <div className="flex flex-wrap gap-1.5">
              {tenses.missingTenses.map((t) => (
                <span key={t} className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Vocabulary</h3>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-full">
            CEFR: {vocabulary.estimatedLevel}
          </span>
          <span className="text-sm text-gray-600">
            Lexical Diversity: <span className="font-semibold">{vocabulary.lexicalDiversity}%</span>
          </span>
        </div>
        {vocabulary.wordDistribution.length > 0 && (
          <div className="space-y-2 mb-4">
            {vocabulary.wordDistribution.map((d) => (
              <BarItem key={d.level} label={d.level} value={d.percentage} max={100} />
            ))}
          </div>
        )}
        {vocabulary.advancedWords.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Advanced Words</p>
            <div className="flex flex-wrap gap-1.5">
              {vocabulary.advancedWords.map((w) => (
                <span key={w} className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Response Depth */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Response Depth</h3>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">
            Overall: <span className="font-semibold">{depth.overallScore}/10</span>
          </span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-sm text-gray-600">
            Avg Length: <span className="font-semibold">{depth.averageResponseLength} words</span>
          </span>
        </div>
        {depth.factorScores.length > 0 && (
          <div className="space-y-2">
            {depth.factorScores.map((f) => (
              <BarItem key={f.name} label={f.name} value={f.score} max={10} />
            ))}
          </div>
        )}
      </div>

      {/* Speaking Pace */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Speaking Pace</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-semibold text-gray-900">{pace.overallWPM}</p>
            <p className="text-xs text-gray-500">Overall WPM</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{pace.presentationWPM}</p>
            <p className="text-xs text-gray-500">Presentation WPM</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{pace.conversationWPM}</p>
            <p className="text-xs text-gray-500">Conversation WPM</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{pace.fluencyScore}<span className="text-sm text-gray-400">/10</span></p>
            <p className="text-xs text-gray-500">Fluency</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Rating: {pace.fluencyRating} (text-based input — WPM reflects typing speed, not speech pace)
        </p>
      </div>
    </div>
  );
}
