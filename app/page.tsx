"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "For Teachers", href: "#teachers" },
];

const THEME_BADGES = [
  { label: "Identidades", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { label: "Experiencias", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  { label: "Ingenio humano", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  { label: "Organización social", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  { label: "Compartir el planeta", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
];

const EXAM_PHASES = [
  { name: "Preparation", duration: "15 min", description: "Study the image" },
  { name: "Presentation", duration: "3–4 min", description: "Present your analysis" },
  { name: "Follow-up", duration: "4–5 min", description: "Answer questions" },
  { name: "General Discussion", duration: "5–6 min", description: "Broader conversation" },
];

// ── Mock UI Components ──

function MockSessionUI() {
  const barPeaks = [16, 28, 22, 36, 18, 40, 24, 34, 20, 38, 14, 26];

  return (
    <div className="relative">
      <div className="animate-float rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-indigo-100/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <span className="text-xs font-medium text-gray-500">Practice Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <span className="text-xs text-green-600 font-medium">Live</span>
          </div>
        </div>

        <div className="px-5 pt-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
            <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
            Identidades
          </span>
        </div>

        <div className="mx-5 mt-4 flex flex-col items-center justify-center py-5 bg-indigo-50 rounded-xl">
          <div className="flex items-end justify-center gap-[3px] h-12">
            {barPeaks.map((peak, i) => (
              <div
                key={i}
                className="w-1.5 bg-indigo-400 rounded-full"
                style={{
                  animation: "bar-wave 0.8s ease-in-out infinite",
                  animationDelay: `${i * 60}ms`,
                  // @ts-expect-error CSS custom property
                  "--bar-peak": `${peak}px`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-indigo-600 font-medium mt-2">Examiner speaking...</span>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-start">
            <div className="bg-indigo-50 rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[85%]">
              <p className="text-sm text-gray-800">&ldquo;¿Qué puedes observar en esta imagen?&rdquo;</p>
              <p className="text-[10px] text-gray-400 mt-1">Examiner</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-gray-100 rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[85%]">
              <p className="text-sm text-gray-800">&ldquo;En la imagen se puede ver una familia celebrando...&rdquo;</p>
              <p className="text-[10px] text-gray-400 mt-1 text-right">You</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute -bottom-8 -right-4 lg:-right-8 w-52 rounded-xl border border-gray-200 bg-white shadow-lg p-4"
        style={{ animation: "float 6s ease-in-out 1s infinite" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-900">Session Score</span>
          <span className="text-lg font-bold text-indigo-600">24<span className="text-sm text-gray-400">/30</span></span>
        </div>
        <div className="space-y-2">
          {[
            { label: "A: Language", score: 9, max: 12, color: "bg-indigo-500" },
            { label: "B1: Presentation", score: 5, max: 6, color: "bg-blue-500" },
            { label: "B2: Conversation", score: 5, max: 6, color: "bg-purple-500" },
            { label: "C: Interactive", score: 5, max: 6, color: "bg-teal-500" },
          ].map((criterion) => (
            <div key={criterion.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-500">{criterion.label}</span>
                <span className="text-[10px] font-medium text-gray-700">
                  {criterion.score}/{criterion.max}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full animate-score-fill ${criterion.color}`}
                  style={{
                    // @ts-expect-error CSS custom property
                    "--score-width": `${(criterion.score / criterion.max) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockThemeSelector() {
  const themes = [
    { label: "Identidades", color: "border-blue-300 bg-blue-50", dot: "bg-blue-500", selected: true },
    { label: "Experiencias", color: "border-green-200 bg-green-50/50", dot: "bg-green-500", selected: false },
    { label: "Ingenio humano", color: "border-purple-200 bg-purple-50/50", dot: "bg-purple-500", selected: false },
    { label: "Organización social", color: "border-orange-200 bg-orange-50/50", dot: "bg-orange-500", selected: false },
    { label: "Compartir el planeta", color: "border-teal-200 bg-teal-50/50", dot: "bg-teal-500", selected: false },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-gray-100/50">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Choose a theme</p>
      <div className="space-y-2">
        {themes.map((t) => (
          <div
            key={t.label}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
              t.selected ? `${t.color} shadow-sm` : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
            <span className={`text-sm ${t.selected ? "font-medium text-gray-900" : "text-gray-600"}`}>
              {t.label}
            </span>
            {t.selected && (
              <svg aria-hidden="true" className="w-4 h-4 text-blue-500 ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPrepScreen() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-100/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-500">Preparation Phase</span>
        <span className="text-xs font-mono font-bold text-indigo-600">12:34</span>
      </div>
      <div className="p-4 flex gap-4">
        <div className="w-28 h-20 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/50 flex items-center justify-center shrink-0">
          <svg aria-hidden="true" className="w-8 h-8 text-amber-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 mb-1.5">Your notes</p>
          <div className="space-y-1.5">
            <div className="h-2 bg-gray-100 rounded-full w-full" />
            <div className="h-2 bg-gray-100 rounded-full w-4/5" />
            <div className="h-2 bg-gray-100 rounded-full w-3/5" />
          </div>
          <p className="text-[10px] text-gray-300 mt-2 italic">Las tradiciones familiares...</p>
        </div>
      </div>
    </div>
  );
}

function MockVoiceSession() {
  const barPeaks = [14, 26, 20, 34, 16, 38, 22, 32, 18, 36, 12, 24];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-100/50 overflow-hidden">
      <div className="px-5 py-6 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
            <div className="flex items-end justify-center gap-[2px] h-10">
              {barPeaks.map((peak, i) => (
                <div
                  key={i}
                  className="w-1 bg-indigo-400 rounded-full"
                  style={{
                    animation: "bar-wave 0.8s ease-in-out infinite",
                    animationDelay: `${i * 55}ms`,
                    // @ts-expect-error CSS custom property
                    "--bar-peak": `${peak}px`,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-200" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
        </div>
        <span className="text-xs text-indigo-600 font-medium mb-4">Examiner speaking...</span>
      </div>

      <div className="px-5 pb-4 space-y-2.5">
        <div className="flex justify-start">
          <div className="bg-indigo-50 rounded-2xl rounded-tl-md px-3.5 py-2 max-w-[85%]">
            <p className="text-xs text-gray-700">&ldquo;¿Cómo se relaciona esta imagen con tu vida personal?&rdquo;</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-gray-100 rounded-2xl rounded-tr-md px-3.5 py-2 max-w-[85%]">
            <p className="text-xs text-gray-700">&ldquo;Me recuerda a las celebraciones de mi familia...&rdquo;</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-indigo-50 rounded-2xl rounded-tl-md px-3.5 py-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" style={{ animation: "typing-dots 1.4s infinite", animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" style={{ animation: "typing-dots 1.4s infinite", animationDelay: "200ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" style={{ animation: "typing-dots 1.4s infinite", animationDelay: "400ms" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockFeedbackCard() {
  const { ref, isVisible } = useInView(0.2);
  const criteria = [
    { label: "A: Language", score: 9, max: 12, color: "bg-indigo-500", pct: 75 },
    { label: "B1: Presentation", score: 5, max: 6, color: "bg-blue-500", pct: 83 },
    { label: "B2: Conversation", score: 5, max: 6, color: "bg-purple-500", pct: 83 },
    { label: "C: Interactive", score: 5, max: 6, color: "bg-teal-500", pct: 83 },
  ];

  return (
    <div ref={ref} className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-100/50 overflow-hidden">
      {/* Score banner */}
      <div className="bg-green-50 border-b border-green-200 px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-700">24</span>
          <span className="text-sm text-gray-400">/30</span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700 border border-green-200 ml-1">
            Good
          </span>
        </div>
      </div>

      {/* Criterion bars */}
      <div className="px-5 py-4 space-y-3">
        {criteria.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-500">{c.label}</span>
              <span className="text-[11px] font-medium text-gray-700">{c.score}/{c.max}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${c.color} transition-all duration-1000 ease-out`}
                style={{ width: isVisible ? `${c.pct}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tense pills + CEFR */}
      <div className="px-5 pb-4 flex flex-wrap items-center gap-1.5">
        {[
          { tense: "Presente", count: 12 },
          { tense: "Pretérito", count: 5 },
          { tense: "Subjuntivo", count: 2 },
        ].map((t) => (
          <span key={t.tense} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded-full">
            {t.tense} <span className="text-indigo-400 font-medium">{t.count}</span>
          </span>
        ))}
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full ml-auto">
          CEFR B2
        </span>
      </div>
    </div>
  );
}

function MockStudentDashboard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <span className="text-xs font-medium text-gray-500">Student Dashboard</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { value: "12", label: "Sessions" },
            { value: "22/30", label: "Average" },
            { value: "26/30", label: "Best" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Mini sparkline */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-400 mb-2">Score Trend</p>
          <svg viewBox="0 0 200 40" className="w-full h-8">
            <polyline
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,35 25,30 50,28 75,32 100,24 125,20 150,18 175,15 200,12"
            />
            <circle cx="200" cy="12" r="3" fill="#6366f1" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MockTeacherDashboard() {
  const recentActivity = [
    { name: "Maria S.", theme: "Identidades", score: "24/30", color: "text-blue-600" },
    { name: "Carlos R.", theme: "Experiencias", score: "19/30", color: "text-green-600" },
    { name: "Ana L.", theme: "Ingenio humano", score: "22/30", color: "text-purple-600" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <span className="text-xs font-medium text-gray-500">Teacher Dashboard</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { value: "24", label: "Students" },
            { value: "18", label: "Sessions" },
            { value: "21/30", label: "Class Avg" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Activity feed */}
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400">Recent Activity</p>
          {recentActivity.map((a) => (
            <div key={a.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-[8px] font-medium text-gray-500">{a.name.charAt(0)}</span>
                </div>
                <span className="text-xs text-gray-700">{a.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${a.color}`}>{a.theme}</span>
                <span className="text-xs font-medium text-gray-900">{a.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimatedRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useInView(0.15);
  return (
    <div ref={ref} className={`animate-in ${isVisible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

function BentoGrid() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in ${isVisible ? "visible" : ""}`}
    >
      {/* Voice Conversations — 2 cols x 2 rows */}
      <div className="sm:col-span-2 sm:row-span-2 rounded-2xl border border-indigo-200 bg-indigo-50 p-8 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Voice Conversations</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Speak naturally with an AI examiner using real-time voice. No typing — just talk, like the real exam.
          </p>
        </div>
        <div className="flex items-end justify-center gap-[3px] h-24 bg-white/60 rounded-xl py-4">
          {[14, 26, 20, 34, 16, 38, 22, 32, 18, 36, 12, 24, 28, 16, 30].map((peak, i) => (
            <div
              key={i}
              className="w-2 bg-indigo-400 rounded-full"
              style={{
                animation: "bar-wave 0.8s ease-in-out infinite",
                animationDelay: `${i * 50}ms`,
                // @ts-expect-error CSS custom property
                "--bar-peak": `${peak}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* IB Rubric Scoring — 2 cols x 1 row */}
      <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Official IB Rubric Scoring</h3>
        <div className="space-y-2.5">
          {[
            { label: "A: Language", pct: 75, color: "bg-indigo-500" },
            { label: "B1: Presentation", pct: 83, color: "bg-blue-500" },
            { label: "B2: Conversation", pct: 67, color: "bg-purple-500" },
            { label: "C: Interactive", pct: 83, color: "bg-teal-500" },
          ].map((c) => (
            <div key={c.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500">{c.label}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.color} transition-all duration-1000 ease-out`}
                  style={{ width: isVisible ? `${c.pct}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CEFR Vocabulary — 1 col x 1 row */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">CEFR Vocabulary</h3>
        <p className="text-xs text-gray-500 mb-4">Your vocabulary mapped to European proficiency levels</p>
        <div className="space-y-1.5">
          {["C2", "C1", "B2", "B1", "A2", "A1"].map((level) => (
            <div key={level} className="flex items-center gap-2">
              <span className={`text-xs font-mono w-6 ${level === "B2" ? "font-bold text-indigo-600" : "text-gray-400"}`}>
                {level}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    level === "B2" ? "bg-indigo-500 shadow-sm shadow-indigo-200" :
                    level === "B1" || level === "A2" ? "bg-indigo-200" : "bg-gray-200"
                  }`}
                  style={{
                    width: level === "B2" ? "100%" :
                           level === "B1" ? "70%" :
                           level === "A2" ? "40%" :
                           level === "A1" ? "20%" : "0%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Speaking Pace — 1 col x 1 row */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col items-center justify-center text-center">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Speaking Pace</h3>
        <p className="text-4xl font-bold text-gray-900">124</p>
        <p className="text-sm text-gray-400 mb-2">words per minute</p>
        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
          Natural pace
        </span>
      </div>

      {/* Grammar & Tenses — 2 cols x 1 row */}
      <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Grammar & Tense Detection</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { tense: "Presente", count: 12 },
            { tense: "Pretérito", count: 8 },
            { tense: "Imperfecto", count: 5 },
            { tense: "Subjuntivo", count: 2 },
            { tense: "Futuro", count: 3 },
          ].map((t) => (
            <span key={t.tense} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-full">
              {t.tense} <span className="text-indigo-400 font-semibold">{t.count}</span>
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-red-200 text-red-400 text-sm rounded-full">
            Condicional <span className="font-semibold">0</span>
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Tenses you use — and the ones you&apos;re missing</p>
      </div>

      {/* Progress Over Time — 2 cols x 1 row */}
      <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Progress Over Time</h3>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400">22</span>
            <svg aria-hidden="true" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
            <span className="text-sm font-bold text-green-600">26</span>
          </div>
        </div>
        <svg viewBox="0 0 400 80" className="w-full h-16">
          <defs>
            <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,65 L50,55 L100,50 L150,58 L200,42 L250,35 L300,30 L350,22 L400,15 L400,80 L0,80 Z"
            fill="url(#sparkGradient)"
          />
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,65 50,55 100,50 150,58 200,42 250,35 300,30 350,22 400,15"
          />
          <circle cx="400" cy="15" r="4" fill="#6366f1" />
        </svg>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Habla" width={100} height={32} priority />
            </div>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Start Practicing
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-gray-600 hover:text-gray-900 py-1.5"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link href="/auth/login" className="text-sm font-medium text-gray-700 py-1.5">
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white text-center hover:bg-indigo-700 transition-colors"
              >
                Start Practicing
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 pb-28 lg:pt-28 lg:pb-40">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="max-w-xl">
              <div className="animate-fade-in-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                IB Language B Aligned
              </div>

              <h1 className="animate-fade-in-up-delay-1 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                Ace Your IB Spanish{" "}
                <span className="text-indigo-600">Individual Oral</span>
              </h1>

              <p className="animate-fade-in-up-delay-2 mt-6 text-lg text-gray-600 leading-relaxed">
                Practice unlimited times with a realistic AI examiner. Get scored
                instantly on all 4 IB criteria — and walk into your oral exam confident.
              </p>

              <div className="animate-fade-in-up-delay-3 mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  Start Practicing
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  See How It Works
                </a>
              </div>

              <p className="animate-fade-in-up-delay-3 mt-5 text-sm text-gray-500">
                Free to get started. No credit card required.
              </p>

              <div className="animate-fade-in-up-delay-3 mt-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    { initials: "SM", bg: "bg-indigo-500" },
                    { initials: "AL", bg: "bg-blue-500" },
                    { initials: "JR", bg: "bg-purple-500" },
                    { initials: "MK", bg: "bg-teal-500" },
                    { initials: "LS", bg: "bg-indigo-400" },
                  ].map((avatar) => (
                    <div
                      key={avatar.initials}
                      className={`w-8 h-8 rounded-full ${avatar.bg} ring-2 ring-white flex items-center justify-center`}
                    >
                      <span className="text-[10px] font-semibold text-white">{avatar.initials}</span>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-500">Trusted by IB students and teachers worldwide</span>
              </div>
            </div>

            <div className="mt-16 lg:mt-0 flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <MockSessionUI />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Exam Flow Timeline ── */}
      <section className="py-14 bg-gradient-to-b from-white to-gray-50/50">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
            Mirrors the Real IB Exam
          </h2>
          <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-10">
            Mirrors the real IB IO exam format
          </p>

          {/* Timeline — vertical on mobile, horizontal on md+ */}
          {/* Mobile vertical layout */}
          <ol className="md:hidden flex flex-col gap-4 mb-10">
            {EXAM_PHASES.map((phase) => (
              <li key={phase.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-300 flex items-center justify-center shadow-sm shrink-0">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{phase.name}</span>
                <span className="text-xs text-gray-400">{phase.duration}</span>
              </li>
            ))}
          </ol>

          {/* Desktop horizontal layout */}
          <ol className="hidden md:flex relative items-start justify-between mb-10">
            {/* Connecting line */}
            <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-gray-200" aria-hidden="true">
              <div className="h-full bg-indigo-400 rounded-full animate-timeline-fill" />
            </div>

            {EXAM_PHASES.map((phase, i) => (
              <li key={phase.name} className="relative flex flex-col items-center z-10 w-1/4">
                <div
                  className="w-8 h-8 rounded-full bg-white border-2 border-indigo-300 flex items-center justify-center shadow-sm"
                  style={{ animation: `fadeInUp 0.5s ease-out ${0.3 + i * 0.2}s both` }}
                >
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                </div>
                <span className="mt-2.5 text-xs font-semibold text-gray-800 text-center leading-tight">
                  {phase.name}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">{phase.duration}</span>
              </li>
            ))}
          </ol>

          {/* Theme badges */}
          <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
            Across all 5 IB themes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {THEME_BADGES.map((theme) => (
              <span
                key={theme.label}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${theme.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                {theme.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works — Alternating Feature Rows ── */}
      <section id="how-it-works" className="py-24 lg:py-32" style={{ scrollMarginTop: "80px" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Four steps that mirror the real IB Individual Oral, so you practice exactly what you&apos;ll face on exam day.
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {/* Step 01 — Pick Your Topic */}
            <AnimatedRow>
              <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                <div className="mb-10 lg:mb-0">
                  <span className="text-6xl font-bold text-indigo-100">01</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Pick Your Topic</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Choose from 5 IB themes and select a culturally rich image as your discussion stimulus.
                    Each theme covers a different aspect of the IB curriculum.
                  </p>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <div className="w-full max-w-sm">
                    <MockThemeSelector />
                  </div>
                </div>
              </div>
            </AnimatedRow>

            {/* Step 02 — Prepare Your Notes */}
            <AnimatedRow>
              <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                <div className="lg:order-2 mb-10 lg:mb-0">
                  <span className="text-6xl font-bold text-indigo-100">02</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Prepare Your Notes</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Study the image and plan your response — just like the real exam.
                    You get 15 minutes to prepare, with the image and cultural context visible.
                  </p>
                </div>
                <div className="lg:order-1 flex justify-center lg:justify-start">
                  <div className="w-full max-w-sm">
                    <MockPrepScreen />
                  </div>
                </div>
              </div>
            </AnimatedRow>

            {/* Step 03 — Speak With Your AI Examiner */}
            <AnimatedRow>
              <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                <div className="mb-10 lg:mb-0">
                  <span className="text-6xl font-bold text-indigo-100">03</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Speak With Your AI Examiner</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Present your analysis, then converse naturally. The examiner adapts
                    its questions to your level in real time — using voice or text.
                  </p>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <div className="w-full max-w-sm">
                    <MockVoiceSession />
                  </div>
                </div>
              </div>
            </AnimatedRow>

            {/* Step 04 — Get Detailed Feedback */}
            <AnimatedRow>
              <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                <div className="lg:order-2 mb-10 lg:mb-0">
                  <span className="text-6xl font-bold text-indigo-100">04</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Get Detailed Feedback</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Receive scores across all 4 IB criteria with specific strengths,
                    improvements, tense analysis, vocabulary level, and speaking pace.
                  </p>
                </div>
                <div className="lg:order-1 flex justify-center lg:justify-start">
                  <div className="w-full max-w-sm">
                    <MockFeedbackCard />
                  </div>
                </div>
              </div>
            </AnimatedRow>
          </div>
        </div>
      </section>

      {/* ── Features — Bento Grid ── */}
      <section id="features" className="py-24 lg:py-32 bg-gray-50/50" style={{ scrollMarginTop: "80px" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Everything You Need to Prepare
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Detailed analytics that go far beyond a simple score. Understand exactly where to improve.
            </p>
          </div>

          <BentoGrid />
        </div>
      </section>

      {/* ── For Students & Teachers — Split Screen ── */}
      <section id="teachers" className="py-24 lg:py-32" style={{ scrollMarginTop: "80px" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Two Dashboards. One Platform.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Whether you&apos;re preparing for your exam or managing a classroom, Habla has you covered.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Student panel */}
            <AnimatedRow>
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600">
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">For Students</h3>
                </div>

                <div className="mb-6">
                  <MockStudentDashboard />
                </div>

                <ul className="space-y-3 mb-6">
                  {[
                    "Practice anytime, as many times as you want",
                    "Scored on all 4 IB criteria after every session",
                    "Track your progress with detailed charts",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <svg aria-hidden="true" className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Start practicing
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </AnimatedRow>

            {/* Teacher panel */}
            <AnimatedRow>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600">
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">For Teachers</h3>
                </div>

                <div className="mb-6">
                  <MockTeacherDashboard />
                </div>

                <ul className="space-y-3 mb-6">
                  {[
                    "Share a class join code with your students",
                    "Upload custom images with talking points",
                    "Review every transcript and score",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <svg aria-hidden="true" className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Set up your class
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </AnimatedRow>
          </div>
        </div>
      </section>

      {/* ── Exam Alignment Trust Strip ── */}
      <section className="py-16 lg:py-20 bg-indigo-50 border-y border-indigo-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-8 lg:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                Trusted by IB students. Aligned with the real exam.
              </h2>
              <div className="flex items-center gap-6 mt-6">
                {[
                  { value: "500+", label: "Sessions" },
                  { value: "50+", label: "Students" },
                  { value: "4.8/5", label: "Rating" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-6">
                    {i > 0 && <div className="w-px h-10 bg-indigo-200" />}
                    <div>
                      <p className="text-2xl font-bold text-indigo-600">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <ul className="space-y-4">
                {[
                  "Scored on the official IB criteria: A, B1, B2, and C",
                  "Follows the exact exam phases: Prep, Presentation, Discussion",
                  "Full 30-point rubric scale with band descriptors",
                  "Your data is private and never shared with third parties",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg aria-hidden="true" className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 italic mt-4">
                Habla is not affiliated with or endorsed by the IB Organization
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight text-center mb-16">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-gray-200">
            {[
              {
                q: "Is Habla endorsed by the IB?",
                a: "Habla is an independent practice tool aligned with the IB Individual Oral format. We are not affiliated with or endorsed by the International Baccalaureate Organization.",
              },
              {
                q: "How accurate is the AI scoring?",
                a: "Our AI examiner scores your performance using the official IB rubric criteria (A, B1, B2, C) on the full 30-point scale. While no AI is perfect, it provides consistent, detailed feedback to help you identify areas for improvement.",
              },
              {
                q: "Is it really free?",
                a: "Yes — Habla is completely free for students. No credit card, no trial period. Teachers can create classes and manage students at no cost.",
              },
              {
                q: "Is my data private?",
                a: "Absolutely. Your session recordings, transcripts, and scores are private to you (and your teacher, if you join a class). We never share your data with third parties.",
              },
              {
                q: "Can I use Habla for French or other languages?",
                a: "Currently Habla supports IB Spanish B only. We\u2019re exploring other languages for the future.",
              },
            ].map((faq, i, arr) => (
              <div key={faq.q} className={`py-6 ${i === arr.length - 1 ? "border-b-0" : ""}`}>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-700" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full -translate-y-1/2 -translate-x-1/2 opacity-30" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-800 rounded-full translate-y-1/3 translate-x-1/4 opacity-30" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            Your next IO practice session is one click away
          </h2>
          <p className="mt-6 text-lg text-indigo-100 max-w-xl mx-auto">
            Stop stressing about your Individual Oral. Start practicing with an AI examiner that prepares you for the real thing.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-indigo-600 shadow-lg hover:bg-indigo-50 transition-all active:scale-[0.98]"
            >
              Start Practicing
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
            >
              Log In
            </Link>
          </div>
          <p className="mt-6 text-sm text-indigo-200">
            Free for students and teachers. No credit card required.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <Image src="/logo.png" alt="Habla" width={80} height={26} />
              <p className="mt-3 text-sm text-gray-500">AI-powered IB Spanish speaking practice</p>
              <p className="mt-2 text-xs text-gray-400">&copy; 2026 Habla. All rights reserved.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2">
                <li><a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">How It Works</a></li>
                <li><a href="#features" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Features</a></li>
                <li><a href="#teachers" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">For Teachers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@habla.app" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
