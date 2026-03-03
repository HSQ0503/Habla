"use client";

import { useState, useEffect, useRef } from "react";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { themeColors } from "@/lib/theme-colors";
import { pickRandomTheme, IB_THEME_LABELS, type IBTheme } from "@/lib/ib-themes";
import { MIN_CONVERSE_SECONDS, WARN_CONVERSE_SECONDS, MAX_CONVERSE_SECONDS, FOLLOWUP_TARGET_SECONDS } from "@/lib/test-config";
import AudioVisualizer from "./AudioVisualizer";
import SpeakingIndicator from "./SpeakingIndicator";
import VoiceControls from "./VoiceControls";
import type { ConnectionState } from "@/lib/realtime-client";
import type { ChatMessage } from "@/lib/types";

type VoiceState = {
  connectionState: ConnectionState;
  transcript: ChatMessage[];
  isAiSpeaking: boolean;
  isMicMuted: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMic: () => void;
  getMediaStream: () => MediaStream | null;
  updateSession: (config: Record<string, unknown>) => void;
  triggerResponse: (text?: string) => void;
  addMarker: (content: string) => void;
};

type Props = {
  sessionId: string;
  image: {
    url: string;
    theme: string;
  };
  language?: string;
  voice: VoiceState;
  onComplete: () => void;
  onFallbackToText: () => void;
};

const WARN_SECONDS = WARN_CONVERSE_SECONDS;
const MAX_SECONDS = MAX_CONVERSE_SECONDS;

function timerColor(elapsed: number) {
  const minutes = elapsed / 60;
  if (minutes < 8) return "text-green-600";
  if (minutes < 10) return "text-yellow-600";
  return "text-red-600";
}

function timerZoneLabel(elapsed: number, subPhase: "follow-up" | "general") {
  const minutes = elapsed / 60;
  if (subPhase === "follow-up") {
    if (minutes < 4) return "Part 2: Follow-up Discussion";
    return "Transitioning soon...";
  }
  if (minutes < 10) return "Part 3: General Discussion";
  return "Time to wrap up";
}

export default function VoiceConversPhase({ sessionId, image, language, voice, onComplete, onFallbackToText }: Props) {
  const [ending, setEnding] = useState(false);
  const endingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { formattedTime, totalElapsed } = useSessionTimer("up");
  const canEnd = totalElapsed >= MIN_CONVERSE_SECONDS;
  const showWarning = totalElapsed >= WARN_SECONDS && totalElapsed < MAX_SECONDS;

  // Sub-phase tracking
  const [subPhase, setSubPhase] = useState<"follow-up" | "general">("follow-up");
  const [generalThemeLabel, setGeneralThemeLabel] = useState<string | null>(null);
  const transitioned = useRef(false);

  const theme = themeColors[image.theme] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: image.theme,
  };

  const lang = language || "es";

  // Auto-end at max time
  useEffect(() => {
    if (totalElapsed >= MAX_SECONDS && !endingRef.current) {
      endingRef.current = true;
      onComplete();
    }
  }, [totalElapsed, onComplete]);

  // Timer-based transition from follow-up to general discussion
  useEffect(() => {
    if (transitioned.current || totalElapsed < FOLLOWUP_TARGET_SECONDS) return;
    transitioned.current = true;

    const storageKey = `habla-general-theme-${sessionId}`;
    const stored = sessionStorage.getItem(storageKey);
    let themePick: IBTheme;
    let labelPick: string;

    if (stored) {
      const parsed = JSON.parse(stored);
      themePick = parsed.theme;
      labelPick = parsed.label;
    } else {
      themePick = pickRandomTheme(image.theme);
      labelPick = IB_THEME_LABELS[themePick]?.[lang === "en" ? "en" : "es"] || themePick;
      sessionStorage.setItem(storageKey, JSON.stringify({ theme: themePick, label: labelPick }));
    }

    // React 18+ batches these into a single render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGeneralThemeLabel(labelPick);
    setSubPhase("general");

    // Inject transcript marker
    voice.addMarker(`General Discussion — ${labelPick}`);

    // Fetch new instructions and update the AI session
    fetch("/api/realtime/instructions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        subPhase: "general",
        generalTheme: themePick,
        generalThemeLabel: labelPick,
      }),
    })
      .then((res) => res.json())
      .then(({ instructions }) => {
        voice.updateSession({ instructions });
        voice.triggerResponse(
          `It has been about 5 minutes of follow-up discussion. Now smoothly transition the conversation to a new theme: ${labelPick}. Briefly acknowledge the previous discussion, then introduce the new theme naturally and ask your first question about it.`
        );
      })
      .catch((err) => console.error("[VOICE] Failed to update for general discussion:", err));
  }, [totalElapsed, sessionId, image.theme, lang, voice]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voice.transcript.length]);

  function handleEnd() {
    if (endingRef.current) return;
    endingRef.current = true;
    setEnding(true);
    onComplete();
  }

  // Only show error overlay for genuine connection failures, not transient API errors
  const showErrorOverlay = voice.connectionState === "failed";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
            subPhase === "follow-up"
              ? "bg-purple-50 border-purple-200"
              : "bg-emerald-50 border-emerald-200"
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              subPhase === "follow-up" ? "bg-purple-400" : "bg-emerald-400"
            }`} />
            <span className={`text-sm font-medium ${
              subPhase === "follow-up" ? "text-purple-700" : "text-emerald-700"
            }`}>
              {subPhase === "follow-up" ? "Part 2: Follow-up" : "Part 3: General"}
            </span>
          </div>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
            {subPhase === "general" && generalThemeLabel ? generalThemeLabel : theme.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-xl font-mono font-semibold tabular-nums ${timerColor(totalElapsed)}`}>
              {formattedTime}
            </p>
            <p className="text-xs text-gray-500">{timerZoneLabel(totalElapsed, subPhase)}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      {showWarning && (
        <div className="shrink-0 px-6 py-2 bg-amber-50 border-b border-amber-200 text-center">
          <p className="text-sm text-amber-700 font-medium">
            10 minutes reached — conversation will auto-end at 12 minutes
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Image sidebar */}
        <div className="shrink-0 lg:w-80 lg:border-r border-b lg:border-b-0 border-gray-200 bg-white">
          <div className="p-4">
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Practice image"
                className="w-full aspect-[4/3] object-cover max-h-48 lg:max-h-none"
              />
            </div>
            <div className="mt-2 flex justify-center">
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${theme.bg} ${theme.text}`}>
                {theme.label}
              </span>
            </div>
          </div>
        </div>

        {/* Voice + transcript area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Audio visualizer */}
              <AudioVisualizer
                mediaStream={voice.getMediaStream()}
                isAiSpeaking={voice.isAiSpeaking}
                isMicMuted={voice.isMicMuted}
              />

              {/* Speaking indicator */}
              <SpeakingIndicator
                isAiSpeaking={voice.isAiSpeaking}
                isMicMuted={voice.isMicMuted}
                connectionState={voice.connectionState}
              />

              {/* Chat bubble transcript */}
              {voice.transcript
                .filter((m) => m.role === "student" || m.role === "examiner" || m.role === "phase-transition")
                .map((msg, i) => {
                  if (msg.role === "phase-transition") {
                    return (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <div className="flex-1 h-px bg-emerald-200" />
                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider whitespace-nowrap">
                          {msg.content}
                        </span>
                        <div className="flex-1 h-px bg-emerald-200" />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
                      style={{ animation: "fadeIn 0.2s ease-out" }}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                          msg.role === "student"
                            ? "bg-gray-100 text-gray-900 rounded-br-md shadow-sm"
                            : "bg-indigo-50 text-indigo-900 rounded-bl-md border border-indigo-100"
                        }`}
                      >
                        <p className="text-xs font-medium mb-1 opacity-60">
                          {msg.role === "student" ? "You" : "Examiner"}
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Voice controls */}
          <VoiceControls
            connectionState={voice.connectionState}
            isMicMuted={voice.isMicMuted}
            isAiSpeaking={voice.isAiSpeaking}
            onToggleMic={voice.toggleMic}
            formattedTime={formattedTime}
            timerColorClass={timerColor(totalElapsed)}
            timerLabel={timerZoneLabel(totalElapsed, subPhase)}
            endLabel="End Conversation"
            canEnd={canEnd}
            onEnd={handleEnd}
            ending={ending}
          />
        </div>

        {/* Error overlay */}
        {showErrorOverlay && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm text-center mx-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Voice Connection Lost
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {voice.error || "The voice connection was interrupted. You can switch to text mode to continue."}
              </p>
              <button
                onClick={onFallbackToText}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-3"
              >
                Switch to Text Mode
              </button>
              <button
                onClick={handleEnd}
                className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
