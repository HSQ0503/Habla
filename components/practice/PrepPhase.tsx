"use client";

import { useState } from "react";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { themeColors } from "@/lib/theme-colors";

type Props = {
  image: {
    url: string;
    theme: string;
    culturalContext: string;
    talkingPoints: string[];
  };
  onAdvance: () => void;
};

const PREP_SECONDS = 15 * 60; // 15 minutes
const MIN_PREP_SECONDS = 60; // 1 minute minimum

export default function PrepPhase({ image, onAdvance }: Props) {
  const [notes, setNotes] = useState("");
  const { formattedTime, totalElapsed } = useSessionTimer("down", PREP_SECONDS, onAdvance);
  const canAdvance = totalElapsed >= MIN_PREP_SECONDS;

  const theme = themeColors[image.theme] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: image.theme,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-sm font-medium text-yellow-700">Preparation</span>
          </div>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
            {theme.label}
          </span>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-semibold text-gray-900 tabular-nums">
            {formattedTime}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">remaining</p>
        </div>
      </div>

      {/* Image */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.culturalContext}
          className="w-full max-h-[400px] object-contain bg-gray-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Context + Talking Points */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Cultural Context
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {image.culturalContext}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Talking Points
            </h3>
            <ol className="space-y-2">
              {image.talkingPoints.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 font-medium shrink-0">{i + 1}.</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right column: Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Your Notes
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot down your ideas and key vocabulary here..."
            className="flex-1 min-h-[200px] px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Advance button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onAdvance}
          disabled={!canAdvance}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          I&apos;m Ready — Start Presentation
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
      {!canAdvance && (
        <p className="text-xs text-gray-400 text-right mt-2">
          Available after 1 minute of preparation
        </p>
      )}
    </div>
  );
}
