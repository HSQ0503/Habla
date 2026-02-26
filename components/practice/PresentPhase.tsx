"use client";

import { useState } from "react";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { themeColors } from "@/lib/theme-colors";

type Props = {
  image: {
    url: string;
    theme: string;
    culturalContext: string;
  };
  onAdvance: (presentationText: string) => void;
};

const MIN_PRESENT_SECONDS = 60; // 1 minute minimum

function timerColor(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 3) return "text-green-600";
  if (minutes < 4) return "text-yellow-600";
  return "text-red-600";
}

function timerZoneLabel(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 3) return "Keep going";
  if (minutes < 4) return "Ideal range (3–4 min)";
  return "Consider wrapping up";
}

export default function PresentPhase({ image, onAdvance }: Props) {
  const [text, setText] = useState("");
  const { formattedTime, totalElapsed } = useSessionTimer("up");
  const canAdvance = totalElapsed >= MIN_PRESENT_SECONDS;

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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-700">Presentation</span>
          </div>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
            {theme.label}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-mono font-semibold tabular-nums ${timerColor(totalElapsed)}`}>
            {formattedTime}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{timerZoneLabel(totalElapsed)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image (sidebar) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.culturalContext}
              className="w-full aspect-[4/3] object-cover bg-gray-100"
            />
          </div>
        </div>

        {/* Text area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              <span className="text-xs text-gray-400 font-medium">
                Text mode — voice will be enabled soon
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Present your analysis of the image here. Describe what you see, its cultural significance, and connections to the theme..."
              className="flex-1 min-h-[350px] px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Advance button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => onAdvance(text)}
          disabled={!canAdvance}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          End Presentation — Start Conversation
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
      {!canAdvance && (
        <p className="text-xs text-gray-400 text-right mt-2">
          Available after 1 minute of presenting
        </p>
      )}
    </div>
  );
}
